// =====================================================================
// scripts/seedUsers.js — Seeder: بيحشر مستخدمين وهميين بقاعدة البيانات مباشرة (بدون السيرفر)
// =====================================================================
// بيخلق 7 حسابات: admin واحد + مديرين طابور + 4 مستخدمين عاديين.
// كلهم بنفس كلمة المرور، ومخزّنة مشفّرة بـ bcryptjs (نفس عدد الجولات اللي بيستخدمها register).
//
// الاستخدام:
//   node scripts/seedUsers.js              → يحشر الحسابات (أو بيحدّثها إذا موجودة، ما بيكرر)
//   node scripts/seedUsers.js --tokens     → كمان بيطبع توكنات جاهزة (8 ساعات) بدون login
//   node scripts/seedUsers.js --clean      → بيحذف حسابات الـ seeder بس (إيميلاتها @queueless.test)
//   SEED_PASSWORD='Other@1234' node scripts/seedUsers.js   → كلمة مرور ثانية
//
// بيستخدم نفس mongoDB_URI تبع .env (قاعدة التطوير). بيرفض يشتغل لما NODE_ENV=production.
// =====================================================================

require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/user.model.js');

// ---------------------------------------------------------------------
// الإعدادات (عدّلها هون)
// ---------------------------------------------------------------------
// كلمة المرور لازم تكون "قوية" بمعيار isStrongPassword وطولها 8-16،
// لأن مسار changePassword بيفرض هالقواعد (غير هيك ما بتقدر تغيّرها لنفس القيمة).
const PASSWORD = process.env.SEED_PASSWORD || 'Test@12345';

// دومين وهمي: الإيميلات هاي ما بتستقبل رسائل. إشعارات الإيميل (دورك/التالي) رح تفشل بصمت
// بالـ console. إذا بدك تجرب الإيميل فعلياً، بدّل إيميل مستخدم واحد لإيميلك.
const DOMAIN = 'queueless.test';

const SEED_USERS = [
    { key: 'admin1',   firstName: 'Admin',   lastName: 'One',   role: 'admin' },
    { key: 'manager1', firstName: 'Manager', lastName: 'One',   role: 'queueManager' },
    { key: 'manager2', firstName: 'Manager', lastName: 'Two',   role: 'queueManager' },
    { key: 'user1',    firstName: 'User',    lastName: 'One',   role: 'normalUser' },
    { key: 'user2',    firstName: 'User',    lastName: 'Two',   role: 'normalUser' },
    { key: 'user3',    firstName: 'User',    lastName: 'Three', role: 'normalUser' },
    { key: 'user4',    firstName: 'User',    lastName: 'Four',  role: 'normalUser' },
].map((u, i) => ({
    ...u,
    email: `${u.key}@${DOMAIN}`,
    phone: `0900000${String(i + 1).padStart(3, '0')}`,   // فريد لكل مستخدم
}));

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);

async function main() {
    // حمايات
    if (process.env.NODE_ENV === 'production') {
        throw new Error('رفضت التشغيل: NODE_ENV=production');
    }
    if (!process.env.mongoDB_URI) {
        throw new Error('mongoDB_URI مو موجود بـ .env');
    }

    await mongoose.connect(process.env.mongoDB_URI);
    console.log(`القاعدة: ${mongoose.connection.name}`);

    const emails = SEED_USERS.map((u) => u.email);

    // ---- وضع التنظيف ----
    if (has('--clean')) {
        const r = await User.deleteMany({ email: { $in: emails } });
        console.log(`انحذف ${r.deletedCount} حساب. (التذاكر والطوابير المرتبطة بهم ما انلمست)`);
        return;
    }

    // تنبيه لو كلمة المرور ما بتنطبق عليها قواعد التطبيق (ما بنوقف، بس بننبّه)
    if (!validator.isStrongPassword(PASSWORD) || PASSWORD.length > 16) {
        console.warn('تنبيه: كلمة المرور ما بتحقق قواعد التطبيق (قوية + 8-16 حرف)، فمسار changePassword ما رح يقبلها');
    }

    // ---- الحشر (idempotent: لو الحساب موجود بنحدّثه بدل ما نكرره) ----
    const rows = [];
    for (const u of SEED_USERS) {
        const data = {
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            phone: u.phone,
            role: u.role,
            // bcryptjs بنفس 10 جولات اللي بـ register. hash لكل مستخدم (salt مختلف) رغم تشابه كلمة المرور
            password: await bcryptjs.hash(PASSWORD, 10),
            // لازم true، لأن login بيرفض غير المؤكدين
            isConfirmed: true,
        };

        let doc = await User.findOne({ email: u.email });
        if (doc) {
            doc.set(data);
            await doc.save();
        } else {
            doc = await User.create(data);
        }

        // تحقق ذاتي: نتأكد إن الهاش المخزّن فعلاً بيطابق كلمة المرور
        const ok = await bcryptjs.compare(PASSWORD, doc.password);
        rows.push({ role: u.role, email: u.email, password: PASSWORD, id: String(doc._id), 'hash ok': ok ? '✓' : '✗' });
    }

    // مهم جداً: حقل pendingExpiresAt عليه TTL index (بيحذف الحساب بعد 10 دقايق من تاريخه).
    // الحسابات المؤكدة لازم يكون الحقل محذوف تماماً، وإلا رح تختفي بعد 10 دقايق.
    await User.updateMany({ email: { $in: emails } }, { $unset: { pendingExpiresAt: '' } });

    console.table(rows);
    console.log('تسجيل الدخول بـ Postman: POST /api/auth/login  { "email": "...", "password": "' + PASSWORD + '" }');

    // ---- توكنات جاهزة (اختياري): بتتجاوز login وبتتجنب حد 5 محاولات/ساعة ----
    if (has('--tokens')) {
        if (!process.env.SECURITY_CODE) throw new Error('SECURITY_CODE مو موجود بـ .env');
        const tokens = {};
        for (const r of rows) {
            const u = SEED_USERS.find((x) => x.email === r.email);
            tokens[u.key] = jwt.sign({
                id: r.id, firstName: u.firstName, lastName: u.lastName, email: u.email,
                phone: u.phone, role: u.role, purpose: 'authentication', isConfirmed: true,
            }, process.env.SECURITY_CODE, { expiresIn: '8h' });
        }
        console.log('\nتوكنات (صالحة 8 ساعات):');
        console.log(JSON.stringify(tokens, null, 2));
    }
}

main()
    .catch((e) => { console.error('فشل الـ seeder:', e.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
