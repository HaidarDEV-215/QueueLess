# QueueLess

## Digital Queue Management Backend

> Backend API لإدارة الصفوف الرقمية والتذاكر، مبني باستخدام Node.js
> وExpress وMongoDB/Mongoose.

------------------------------------------------------------------------

## فهرس المحتويات

1.  [نبذة عن المشروع](#نبذة-عن-المشروع)
2.  [الهدف العام](#1-الهدف-العام)
3.  [المشاكل التي يحلها النظام](#2-المشاكل-التي-يحلها-النظام)
4.  [فكرة النظام وكيف يعمل](#3-فكرة-النظام-وكيف-يعمل)
5.  [الأدوار والصلاحيات](#الأدوار-والصلاحيات)
6.  [نموذج البيانات](#نموذج-البيانات)
7.  [آلية Linked List](#آلية-linked-list)
8.  [دورة حياة التذكرة](#دورة-حياة-التذكرة)
9.  [المعمارية وبنية المشروع](#المعمارية-وبنية-المشروع)
10. [التقنيات المستخدمة](#التقنيات-المستخدمة)
11. [التثبيت والتشغيل](#4-التثبيت-والتشغيل)
12. [متغيرات البيئة](#متغيرات-البيئة)
13. [API Documentation](#5-api-documentation)
14. [Authentication](#authentication)
15. [Queue and Ticket API](#queue-and-ticket-api)
16. [Manager API](#manager-api)
17. [Account API](#account-api)
18. [Admin API](#admin-api)
19. [تسلسل استخدام النظام
    End-to-End](#6-تسلسل-استخدام-النظام-end-to-end)
20. [الحماية والتحقق](#7-الحماية-والتحقق)
21. [نقاط القوة](#8-نقاط-القوة)
22. [نقاط الضعف والقيود](#9-نقاط-الضعف-والقيود)
23. [الاختبارات المقترحة](#10-الاختبارات-المقترحة)
24. [التشغيل باستخدام Postman](#11-التشغيل-باستخدام-postman)
25. [التحسينات المستقبلية](#12-التحسينات-المستقبلية)
26. [الخلاصة](#13-الخلاصة)

------------------------------------------------------------------------

# نبذة عن المشروع

QueueLess هو Backend API لنظام صفوف رقمية Digital Queue Management
System.

الفكرة الأساسية هي استبدال الانتظار الفيزيائي التقليدي بتسلسل رقمي من
التذاكر. يستطيع المستخدم تسجيل حسابه، الانضمام إلى صف مفتوح، الحصول على
Ticket، معرفة حالتها وموقعها ضمن الصف، وإلغاؤها عندما يكون ذلك مسموحاً.

أما Queue Manager فيستطيع إنشاء الصفوف وإدارتها وتشغيل الصف والانتقال من
تذكرة إلى أخرى.

يوجد أيضاً Administrator لإدارة حسابات المستخدمين وصلاحياتهم على مستوى
النظام.

المشروع Backend-focused، لذلك يمكن اختبار كامل دورة العمل باستخدام
Postman دون الحاجة إلى Frontend.

------------------------------------------------------------------------

# 1. الهدف العام

الهدف من QueueLess هو بناء نظام Backend حقيقي لإدارة الانتظار الرقمي، مع
التركيز على:

-   Authentication باستخدام JWT.
-   Authorization حسب Role.
-   تأكيد الحساب بواسطة OTP عبر البريد الإلكتروني.
-   استعادة كلمة المرور بواسطة OTP.
-   إدارة Queue.
-   إدارة Ticket lifecycle.
-   تمثيل ترتيب التذاكر باستخدام Linked List داخل MongoDB.
-   فرض سعة الصف.
-   منع بعض العمليات غير المسموحة حسب حالة التذكرة أو ملكية المورد.
-   التعامل مع بعض حالات Concurrent Requests باستخدام MongoDB Atomic
    Operations.
-   حماية الـAPI باستخدام Validation وRate Limiting وHelmet.
-   فصل مسؤوليات Routes وMiddlewares وControllers وServices وModels.

المشروع ليس مجرد CRUD؛ الجزء الأساسي منه هو المحافظة على حالة الصف
وتسلسل التذاكر وتطبيق قواعد العمل الخاصة بها.

------------------------------------------------------------------------

# 2. المشاكل التي يحلها النظام

## 2.1 الانتظار الفيزيائي

في النظام التقليدي يحتاج الشخص إلى البقاء في المكان لمعرفة متى سيأتي
دوره.

QueueLess يسمح للمستخدم بالانضمام إلى الصف رقمياً ثم متابعة حالة تذكرته
من خلال API.

## 2.2 عدم معرفة ترتيب الدور

كل Ticket ترتبط بالتذكرة التي سبقتها من خلال الحقل `prev`.

هذا يسمح للنظام بمعرفة التسلسل المنطقي للتذاكر.

## 2.3 التحكم بالصف

Queue Manager يستطيع:

-   إنشاء Queue.
-   فتح وإغلاق Queue.
-   مشاهدة تذاكر Queue.
-   تفعيل Queue.
-   الانتقال إلى التذكرة التالية.

## 2.4 إدارة إلغاء التذاكر

عندما يلغي المستخدم Ticket، لا يتم التعامل معها كأنها لم تكن موجودة
مباشرة.

تبقى التذكرة بحالة:

``` text
canceled
```

حتى يستطيع نظام معالجة الصف الوصول إليها ضمن التسلسل والتعامل معها.

هذا يحافظ على أثر واضح لعملية الإلغاء بدلاً من حذف التذكرة فوراً.

## 2.5 التحكم بالصلاحيات

النظام يميز بين:

``` text
normalUser
queueManager
admin
```

ولا يسمح للمستخدم العادي بتنفيذ عمليات مدير الصف أو عمليات
Administrator.

------------------------------------------------------------------------

# 3. فكرة النظام وكيف يعمل

يمكن تلخيص النظام بالشكل التالي:

``` text
User
  |
  | Authentication
  v
JWT
  |
  v
Queue
  |
  +---- Ticket 1
  |       prev = null
  |
  +---- Ticket 2
  |       prev = Ticket 1
  |
  +---- Ticket 3
          prev = Ticket 2
```

عند إنشاء Queue يتم تخزين معلومات مثل:

-   اسم الصف.
-   منشئ الصف.
-   السعة.
-   العدد الحالي.
-   آخر Ticket.
-   التذكرة الحالية التي يتم خدمتها.
-   حالة الصف.

عند انضمام مستخدم إلى Queue، ينشئ النظام Ticket جديدة ويضع فيها مرجعاً
إلى آخر Ticket كانت موجودة في نهاية الصف.

مثال:

``` text
Ticket A
prev = null

Ticket B
prev = A

Ticket C
prev = B
```

وعندما يبدأ Manager بمعالجة الصف، يستطيع النظام معرفة التذكرة التالية من
خلال البحث عن:

``` text
Ticket.prev == currentTurn
```

أي:

``` text
Current Ticket
      |
      v
Ticket whose prev = Current Ticket
```

إذا كانت التذكرة التالية ملغاة، يستمر النظام في البحث عن التالية حتى يجد
Ticket قابلة للمعالجة.

------------------------------------------------------------------------

# الأدوار والصلاحيات

## Normal User

المستخدم العادي يستطيع:

-   تسجيل حساب.
-   تأكيد الحساب.
-   تسجيل الدخول.
-   استعادة كلمة المرور.
-   تعديل بيانات حسابه.
-   حذف حسابه.
-   إنشاء Ticket في Queue مفتوحة.
-   مشاهدة تذاكره.
-   مشاهدة Ticket الخاصة به ضمن Queue.
-   معرفة موقع Ticket.
-   إلغاء Ticket التي يملكها عندما تكون بحالة `waiting`.

ولا يستطيع:

-   إنشاء Queue.
-   تشغيل Queue.
-   الانتقال بين تذاكر Queue.
-   تغيير Queue الخاصة بمدير آخر.
-   تنفيذ عمليات Administrator.

## Queue Manager

مدير الصف يستطيع:

-   إنشاء Queue.
-   مشاهدة تذاكر Queue الخاصة به.
-   تعديل Queue الخاصة به.
-   فتح وإغلاق Queue.
-   تفعيل Queue.
-   الانتقال إلى Ticket التالية.

ويتم التحقق من أن Queue فعلاً مملوكة للمدير الحالي، وليس الاكتفاء بفحص
Role فقط.

## Admin

Administrator يستطيع:

-   مشاهدة المستخدمين.
-   حذف مستخدم.
-   تغيير Role لمستخدم.

------------------------------------------------------------------------

# نموذج البيانات

## User

أهم الحقول:

``` text
firstName
lastName
email
role
password
phone
isConfirmed
pendingExpiresAt
createdAt
updatedAt
```

الأدوار المسموحة:

``` text
normalUser
queueManager
admin
```

يتم تخزين كلمة المرور بشكل Hash باستخدام bcryptjs.

الحساب غير المؤكد يستخدم `pendingExpiresAt` مع MongoDB TTL، بحيث يتم
تنظيف الحسابات غير المؤكدة تلقائياً بعد مدة تقريبية.

------------------------------------------------------------------------

## Queue

الحقول الرئيسية:

``` text
name
createdBy
capacity
currentLength
lastTicket
currentTurn
status
createdAt
updatedAt
```

### `currentLength`

يمثل العدد الحالي المستخدم في حساب سعة الصف وفق منطق التطبيق.

### `lastTicket`

يشير إلى آخر Ticket تمت إضافتها إلى الصف، ويستخدم لتحديد `prev` عند
إضافة Ticket جديدة.

### `currentTurn`

تشير إلى Ticket التي يتم خدمتها حالياً.

### `status`

القيم:

``` text
open
closed
```

------------------------------------------------------------------------

## Ticket

الحقول الرئيسية:

``` text
owner
queue
prev
status
isCheckedBySystem
createdAt
updatedAt
```

### `owner`

المستخدم الذي يملك Ticket.

### `queue`

الصف الذي تنتمي إليه Ticket.

### `prev`

مرجع إلى Ticket السابقة في التسلسل.

### `status`

القيم:

``` text
waiting
serving
canceled
finished
```

### `isCheckedBySystem`

يستخدم في بعض عمليات معالجة الصف للمساعدة على منع معالجة نفس Ticket أكثر
من مرة في الطلبات المتزامنة.

------------------------------------------------------------------------

## OTP

يحتوي على:

``` text
user
email
code
expiresAt
createdAt
updatedAt
```

يتم تخزين الـOTP نفسه بشكل Hash وليس كنص صريح.

ويتم استخدام TTL على `expiresAt` لتنظيف سجلات OTP المنتهية.

------------------------------------------------------------------------

# آلية Linked List

QueueLess لا يخزن رقم "عدد الأشخاص أمامك" داخل كل Ticket.

بدلاً من ذلك يستخدم:

``` text
prev
```

مثال:

``` text
Ticket A
prev = null

Ticket B
prev = A

Ticket C
prev = B

Ticket D
prev = C
```

إذا كانت Ticket الحالية هي `B`، يستطيع النظام البحث عن:

``` text
Ticket where prev = B
```

ليجد `C`.

## ميزة هذا التصميم

عند إلغاء Ticket في منتصف الصف، لا يحتاج النظام إلى تعديل جميع التذاكر
التي بعدها.

مثال:

``` text
A -> B -> C -> D
```

إذا ألغيت `B`:

``` text
A -> B(canceled) -> C -> D
```

عند وصول المعالجة إلى `B` يستطيع النظام تجاوزها والانتقال إلى `C`.

------------------------------------------------------------------------

# دورة حياة التذكرة

الحالات الأساسية:

``` text
waiting
   |
   v
serving
   |
   v
finished
```

أو:

``` text
waiting
   |
   v
canceled
```

التذكرة الملغاة لا تصبح `serving`.

------------------------------------------------------------------------

# المعمارية وبنية المشروع

البنية الحالية مبنية بأسلوب Functional/Procedural بسيط، بدون إدخال DDD
أو SOLID أو Class-heavy Architecture.

المكونات الرئيسية:

``` text
QueueLess/
│
├── index.js
│
├── config/
│   └── mongoDB.js
│
├── routes/
│   ├── auth.routes.js
│   ├── queues.routes.js
│   ├── manager.routes.js
│   ├── users.routes.js
│   └── admin.routes.js
│
├── controllers/
│   ├── auth.controllers.js
│   ├── queue.controllers.js
│   ├── usersProfile.controllers.js
│   └── admin.controllers.js
│
├── services/
│   ├── auth.services.js
│   ├── queue.services.js
│   └── usersProfiles.services.js
│
├── models/
│   ├── user.model.js
│   ├── queue.model.js
│   ├── ticket.model.js
│   └── otp.model.js
│
├── middlewares/
│   ├── verifyToken.js
│   ├── validationHandler.js
│   ├── rateLimits.js
│   ├── asyncWrapper.js
│   └── errorHandlers.js
│
├── validators/
│   ├── authValidators.js
│   ├── queueValidators.js
│   └── userUpdateValidators.js
│
└── utils/
    ├── appError.js
    ├── createJWT.js
    ├── emailService.js
    └── emailsTemplates.js
```

## Request Flow

الـRequest العادي يسير تقريباً هكذا:

``` text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Validation / Authentication / Authorization
     ↓
Controller
     ↓
Service
     ↓
Mongoose Model
     ↓
MongoDB
     ↓
Service
     ↓
Controller
     ↓
HTTP Response
```

------------------------------------------------------------------------

# التقنيات المستخدمة

  التقنية              الاستخدام
  -------------------- ------------------------
  Node.js              Runtime
  Express 5            HTTP Server / REST API
  MongoDB              Database
  Mongoose             ODM
  JWT                  Authentication
  bcryptjs             Password / OTP Hashing
  Nodemailer           Email
  express-validator    Request Validation
  express-rate-limit   Rate Limiting
  Helmet               HTTP Security Headers
  CORS                 Cross-Origin Requests
  dotenv               Environment Variables
  validator            Email validation
  crypto               OTP generation
  nodemon              Development server

------------------------------------------------------------------------

# 4. التثبيت والتشغيل

## المتطلبات

تحتاج إلى:

-   Node.js.
-   npm.
-   MongoDB أو MongoDB Atlas.
-   حساب بريد SMTP صالح إذا أردت تشغيل وظائف OTP والبريد الإلكتروني.

لا يحتاج المشروع إلى Frontend لكي يعمل.

------------------------------------------------------------------------

## 4.1 تنزيل المشروع

بعد الحصول على المشروع:

``` bash
git clone https://github.com/HaidarDEV-215/QueueLess.git
cd QueueLess
```

إذا كان المشروع لديك كملف ZIP:

``` bash
unzip QueueLess.zip
cd QueueLess
```

------------------------------------------------------------------------

## 4.2 تثبيت الحزم

نفّذ:

``` bash
npm install
```

سيقرأ npm ملف:

``` text
package.json
```

ويثبت Dependencies وDev Dependencies المطلوبة.

------------------------------------------------------------------------

## 4.3 إنشاء ملف `.env`

أنشئ ملفاً باسم:

``` text
.env
```

في جذر المشروع، بجانب `index.js`.

مثال:

``` env
PORT=3000
mongoDB_URI=mongodb://127.0.0.1:27017/queueless
SECURITY_CODE=your_secret_key
APP_EMAIL=your_email@gmail.com
APP_PASSWORD=your_email_app_password
```

### المتغيرات المطلوبة

  المتغير           الاستخدام
  ----------------- ---------------------------------------------
  `PORT`            منفذ Express
  `mongoDB_URI`     رابط MongoDB
  `SECURITY_CODE`   Secret المستخدم لتوقيع JWT
  `APP_EMAIL`       البريد المستخدم لإرسال الرسائل
  `APP_PASSWORD`    كلمة المرور/بيانات SMTP المستخدمة مع البريد

> لا ترفع ملف `.env` إلى GitHub.

------------------------------------------------------------------------

## 4.4 تشغيل التطبيق

المشروع يحتوي على Script:

``` json
"start": "nodemon index.js"
```

لذلك شغّل:

``` bash
npm start
```

وسيبدأ التطبيق على المنفذ الموجود في:

``` env
PORT
```

مثلاً:

``` text
http://localhost:3000
```

إذا كان:

``` env
PORT=3000
```

------------------------------------------------------------------------

## 4.5 تشغيل التطبيق مباشرة

يمكن أيضاً تشغيل:

``` bash
node index.js
```

لكن `npm start` يستخدم `nodemon`، ولذلك يعيد تشغيل التطبيق عند اكتشاف
تغييرات أثناء التطوير.

------------------------------------------------------------------------

# متغيرات البيئة والأمان

يجب عدم وضع القيم الحقيقية التالية داخل Git:

``` text
SECURITY_CODE
APP_PASSWORD
APP_EMAIL
mongoDB_URI
```

استخدم `.gitignore`:

``` gitignore
.env
node_modules/
```

------------------------------------------------------------------------

# 5. API Documentation

## Base URL

أثناء التطوير المحلي:

``` text
http://localhost:3000
```

Base paths المستخدمة:

``` text
/api/auth
/api/queues
/api/accounts
/api/manager
/api/admin
```

------------------------------------------------------------------------

# Authentication

## 1. Register

### Endpoint

``` http
POST /api/auth/register
```

### الهدف

إنشاء حساب جديد غير مؤكد وإرسال OTP لتأكيد البريد.

### Body

``` json
{
  "firstName": "Haidar",
  "lastName": "Shawish",
  "email": "haidar@example.com",
  "phone": "0999999999",
  "password": "StrongPassword123!"
}
```

### الحقول

  الحقل         النوع    مطلوب
  ------------- -------- -------
  `firstName`   String   نعم
  `lastName`    String   نعم
  `email`       String   نعم
  `phone`       String   نعم
  `password`    String   نعم

### قيود مهمة

`firstName` و`lastName`:

``` text
2 - 20 characters
```

كلمة المرور:

``` text
8 - 16 characters
```

ويجب أن تحقق شروط `isStrongPassword()`.

### Response

``` json
{
  "message": "user account created successfully, but email not confirmed!",
  "data": {
    "token": "<temporary-confirmation-token>"
  }
}
```

الـToken الناتج ليس Authentication Token عادياً.

غرضه:

``` text
confirm_account
```

ويستخدم في Endpoint تأكيد الحساب.

------------------------------------------------------------------------

# 2. Confirm Account

### Endpoint

``` http
PUT /api/auth/confirmAccount
```

### Authentication

يجب إرسال Temporary Confirmation Token.

``` http
Authorization: Bearer <temporary-confirmation-token>
```

### Body

``` json
{
  "code": "123456"
}
```

### الهدف

تأكيد الحساب باستخدام OTP.

### Response

``` json
{
  "message": "account confirmed successfully",
  "data": {
    "token": "<authentication-token>"
  }
}
```

الـToken الناتج هو JWT عادي للاستخدام في Endpoints المحمية.

------------------------------------------------------------------------

# 3. Login

### Endpoint

``` http
POST /api/auth/login
```

### Body

``` json
{
  "email": "haidar@example.com",
  "password": "StrongPassword123!"
}
```

### Response

``` json
{
  "message": "user logged in successfully",
  "data": {
    "token": "<jwt>"
  }
}
```

استخدم Token الناتج:

``` http
Authorization: Bearer <jwt>
```

------------------------------------------------------------------------

# 4. Forgot Password

### Endpoint

``` http
POST /api/auth/forgetPassword
```

### Body

``` json
{
  "email": "haidar@example.com"
}
```

### الهدف

إرسال OTP إلى البريد المرتبط بالحساب.

### Response

``` json
{
  "message": "a verification email sent!"
}
```

------------------------------------------------------------------------

# 5. Confirm OTP

### Endpoint

``` http
POST /api/auth/confirmOtp
```

### Body

``` json
{
  "email": "haidar@example.com",
  "code": "123456"
}
```

### الهدف

التحقق من OTP الخاص باستعادة كلمة المرور.

### Response

``` json
{
  "message": "email verified",
  "data": "<password-changing-token>"
}
```

هذا Token مؤقت، والغرض منه:

``` text
password_changing
```

------------------------------------------------------------------------

# 6. Change Password

### Endpoint

``` http
PUT /api/auth/changePassword
```

### Authentication

``` http
Authorization: Bearer <password-changing-token>
```

### Body

``` json
{
  "password": "NewStrongPassword123!"
}
```

### Response

``` json
{
  "message": "password changed"
}
```

------------------------------------------------------------------------

# Queue and Ticket API

## 7. Create Ticket / Join Queue

### Endpoint

``` http
POST /api/queues/tickets
```

### Authentication

``` http
Authorization: Bearer <authentication-token>
```

### Body

``` json
{
  "queueId": "<queue-id>"
}
```

في النسخة الحالية يقبل الـController أيضاً `status`، لكن من ناحية تصميم
الـAPI لا ينبغي للعميل أن يختار حالة Ticket بنفسه؛ الحالة الطبيعية عند
الانضمام هي:

``` text
waiting
```

### الهدف

إضافة المستخدم إلى Queue مفتوحة.

### أهم قواعد العملية

-   يجب أن تكون Queue مفتوحة.
-   يجب ألا تكون Queue ممتلئة.
-   يتم تحديد `prev` اعتماداً على `lastTicket`.
-   يتم تحديث `lastTicket`.
-   يتم تحديث `currentLength`.
-   يتم منع وجود أكثر من Ticket منتظرة للمستخدم نفسه في نفس Queue.

### Response

``` json
{
  "message": "ticket created successfully",
  "data": {
    "_id": "<ticket-id>",
    "owner": "<user-id>",
    "queue": "<queue-id>",
    "prev": "<previous-ticket-id-or-null>",
    "status": "waiting"
  }
}
```

------------------------------------------------------------------------

# 8. Cancel Ticket

### Endpoint

``` http
PUT /api/queues/tickets
```

### Authentication

``` http
Authorization: Bearer <authentication-token>
```

### Body

``` json
{
  "ticketId": "<ticket-id>"
}
```

### الهدف

إلغاء Ticket يملكها المستخدم.

### القاعدة

يجب أن تكون Ticket في حالة:

``` text
waiting
```

ولا يستطيع المستخدم إلغاء Ticket الخاصة بمستخدم آخر.

### Response

``` json
{
  "message": "ticket canceled",
  "data": {
    "...": "ticket data"
  }
}
```

حالة Ticket تصبح:

``` text
canceled
```

------------------------------------------------------------------------

# 9. Get My Tickets

### Endpoint

``` http
GET /api/queues/tickets
```

### Authentication

``` http
Authorization: Bearer <authentication-token>
```

### Query Parameters

اختيارية:

``` text
?page=1&limit=10
```

مثال:

``` http
GET /api/queues/tickets?page=1&limit=10
```

### Response

``` json
{
  "items": 2,
  "data": [
    {
      "...": "ticket"
    }
  ]
}
```

يعيد Tickets الخاصة بالمستخدم الحالي فقط.

------------------------------------------------------------------------

# 10. Get My Ticket in a Queue

### Endpoint

``` http
GET /api/queues/tickets/:queueId
```

### Authentication

``` http
Authorization: Bearer <authentication-token>
```

### مثال

``` http
GET /api/queues/tickets/64f...
```

### الهدف

الحصول على Ticket الخاصة بالمستخدم داخل Queue محددة.

إذا لم توجد Ticket مناسبة، يعيد النظام خطأ.

------------------------------------------------------------------------

# Manager API

جميع Endpoints التالية تتطلب:

``` http
Authorization: Bearer <authentication-token>
```

ويجب أن يكون Role المستخدم:

``` text
queueManager
```

------------------------------------------------------------------------

# 11. Create Queue

### Endpoint

``` http
POST /api/manager
```

### Body

``` json
{
  "name": "General Consultation",
  "capacity": 50,
  "status": "open"
}
```

### الحقول

  الحقل        النوع    مطلوب
  ------------ -------- ---------
  `name`       String   نعم
  `capacity`   Number   نعم
  `status`     String   اختياري

القيم المسموحة لـ`status`:

``` text
open
closed
```

إذا لم يتم إرسال `status`، يستخدم الـController:

``` text
open
```

### Response

``` json
{
  "message": "queue created successfully",
  "data": {
    "...": "queue"
  }
}
```

------------------------------------------------------------------------

# 12. Get All Tickets in Manager Queue

### Endpoint

``` http
GET /api/manager/:queueId
```

### Authentication

Manager فقط.

### Query Parameters

``` text
?page=1&limit=10
```

### مثال

``` http
GET /api/manager/64f...?page=1&limit=10
```

### الهدف

الحصول على Tickets الموجودة في Queue التي يملكها Manager الحالي.

### Ownership

النظام يتحقق من:

``` text
queue._id == queueId
AND
queue.createdBy == currentUser
```

وهذا يمنع Manager من إدارة Queue مملوكة لمدير آخر.

------------------------------------------------------------------------

# 13. Update Queue

### Endpoint

``` http
PUT /api/manager/:queueId
```

### Body

يمكن تعديل:

``` json
{
  "name": "Updated Queue Name",
  "capacity": 100,
  "status": "open"
}
```

جميع الحقول اختيارية.

### الحقول المسموحة

``` text
name
capacity
status
```

### Response

``` json
{
  "message": "ticket updated",
  "data": {
    "...": "updated queue"
  }
}
```

------------------------------------------------------------------------

# 14. Toggle Queue Status

### Endpoint

``` http
PATCH /api/manager/:queueId
```

### Body

لا يحتاج Body.

### السلوك

إذا كانت الحالة:

``` text
open
```

تصبح:

``` text
closed
```

وإذا كانت:

``` text
closed
```

تصبح:

``` text
open
```

### Response

``` json
{
  "message": "done.. queue is open",
  "data": {
    "...": "queue"
  }
}
```

------------------------------------------------------------------------

# 15. Activate Queue

### Endpoint

``` http
POST /api/manager/activate/:queueId
```

### Body

لا يحتاج Body.

### الهدف

بدء معالجة Queue لأول مرة.

النظام يبحث عن أول Ticket في التسلسل، ويتجاوز Tickets الملغاة، ثم يضع
Ticket المناسبة كـ:

``` text
serving
```

ويضعها في:

``` text
Queue.currentTurn
```

### Response

``` json
{
  "message": "queue has been activated",
  "data": {
    "...": "queue"
  }
}
```

------------------------------------------------------------------------

# 16. Move to Next Ticket

### Endpoint

``` http
PUT /api/manager/activate/:queueId
```

### Body

لا يحتاج Body.

### الهدف

إنهاء التذكرة الحالية والانتقال إلى التذكرة التالية.

العملية منطقياً:

``` text
current serving
       |
       v
finished

next ticket
       |
       v
serving
```

إذا كانت Ticket التالية:

``` text
canceled
```

يتم تجاوزها والبحث عن التالية في التسلسل.

### Response

``` json
{
  "message": "swapped to next ticket",
  "data": {
    "...": "queue"
  }
}
```

------------------------------------------------------------------------

# Account API

## 17. Update My Account

### Endpoint

``` http
PUT /api/accounts/me
```

### Authentication

أي مستخدم مسجل دخول.

### Body

يمكن تعديل:

``` json
{
  "firstName": "Haidar",
  "lastName": "Updated",
  "phone": "0999999999"
}
```

كل الحقول اختيارية.

لا يسمح هذا Endpoint بتغيير:

``` text
email
password
role
isConfirmed
```

------------------------------------------------------------------------

# 18. Delete My Account

### Endpoint

``` http
DELETE /api/accounts/me
```

### Authentication

``` http
Authorization: Bearer <authentication-token>
```

### Body

لا يحتاج Body.

### الهدف

حذف حساب المستخدم الحالي.

------------------------------------------------------------------------

# Admin API

جميع Endpoints التالية تتطلب:

``` http
Authorization: Bearer <authentication-token>
```

ويجب أن يكون Role:

``` text
admin
```

------------------------------------------------------------------------

# 19. Get All Users

### Endpoint

``` http
GET /api/admin
```

### Query Parameters

``` text
?page=1&limit=10
```

### Response

``` json
{
  "items": 10,
  "data": [
    {
      "...": "user without password"
    }
  ]
}
```

كلمة المرور لا يتم إرجاعها.

------------------------------------------------------------------------

# 20. Delete User

### Endpoint

``` http
DELETE /api/admin
```

### Body

``` json
{
  "userId": "<user-id>"
}
```

### الهدف

حذف مستخدم بواسطة Administrator.

### Response

``` json
{
  "message": "user deleted successfully",
  "data": null
}
```

------------------------------------------------------------------------

# 21. Change User Role

### Endpoint

``` http
PUT /api/admin/permissions
```

### Body

``` json
{
  "userId": "<user-id>",
  "newRole": "queueManager"
}
```

القيم الصحيحة:

``` text
normalUser
queueManager
admin
```

### Response

``` json
{
  "message": "role changed",
  "data": {
    "...": "updated user"
  }
}
```

------------------------------------------------------------------------

# ملخص جميع الـEndpoints

  \#   Method   Endpoint                           Role
  ---- -------- ---------------------------------- ------------------------------
  1    POST     `/api/auth/register`               Public
  2    PUT      `/api/auth/confirmAccount`         Temporary confirmation token
  3    POST     `/api/auth/login`                  Public
  4    POST     `/api/auth/forgetPassword`         Public
  5    POST     `/api/auth/confirmOtp`             Public
  6    PUT      `/api/auth/changePassword`         Password-change token
  7    POST     `/api/queues/tickets`              Authenticated User
  8    PUT      `/api/queues/tickets`              Authenticated User
  9    GET      `/api/queues/tickets`              Authenticated User
  10   GET      `/api/queues/tickets/:queueId`     Authenticated User
  11   POST     `/api/manager`                     Queue Manager
  12   GET      `/api/manager/:queueId`            Queue Manager
  13   PUT      `/api/manager/:queueId`            Queue Manager
  14   PATCH    `/api/manager/:queueId`            Queue Manager
  15   POST     `/api/manager/activate/:queueId`   Queue Manager
  16   PUT      `/api/manager/activate/:queueId`   Queue Manager
  17   PUT      `/api/accounts/me`                 Authenticated User
  18   DELETE   `/api/accounts/me`                 Authenticated User
  19   GET      `/api/admin`                       Admin
  20   DELETE   `/api/admin`                       Admin
  21   PUT      `/api/admin/permissions`           Admin

> عدد المسارات المنفذة هو 21 عملية HTTP، مع بعض المسارات التي تستخدم نفس
> URL مع Methods مختلفة.

------------------------------------------------------------------------

# 6. تسلسل استخدام النظام End-to-End

فيما يلي السيناريو الطبيعي الكامل.

## المرحلة 1 --- إنشاء الحساب

``` text
POST /api/auth/register
```

المستخدم يرسل:

``` text
name
email
phone
password
```

النظام:

1.  يتحقق من البيانات.
2.  يتحقق من عدم وجود Email سابق.
3.  يقوم بعمل Hash لكلمة المرور.
4.  ينشئ User غير مؤكد.
5.  ينشئ OTP.
6.  يرسل OTP عبر البريد.
7.  يعيد Temporary JWT.

------------------------------------------------------------------------

## المرحلة 2 --- تأكيد الحساب

``` text
PUT /api/auth/confirmAccount
```

المستخدم يرسل OTP مع Temporary Token.

إذا كان صحيحاً:

``` text
isConfirmed = true
```

ثم يحصل المستخدم على Authentication JWT.

------------------------------------------------------------------------

## المرحلة 3 --- تسجيل الدخول

``` text
POST /api/auth/login
```

يحصل المستخدم على JWT.

يستخدمه في:

``` http
Authorization: Bearer <token>
```

------------------------------------------------------------------------

## المرحلة 4 --- مدير ينشئ Queue

Manager يرسل:

``` text
POST /api/manager
```

مثلاً:

``` json
{
  "name": "General Consultation",
  "capacity": 20
}
```

------------------------------------------------------------------------

## المرحلة 5 --- فتح Queue

يمكن استخدام:

``` text
PATCH /api/manager/:queueId
```

لتبديل حالة Queue.

------------------------------------------------------------------------

## المرحلة 6 --- المستخدم ينضم

المستخدم يرسل:

``` text
POST /api/queues/tickets
```

مع:

``` json
{
  "queueId": "<queue-id>"
}
```

إذا كان أول مستخدم:

``` text
Ticket A
prev = null
```

المستخدم الثاني:

``` text
Ticket B
prev = A
```

الثالث:

``` text
Ticket C
prev = B
```

------------------------------------------------------------------------

## المرحلة 7 --- معرفة الموقع

المستخدم يرسل:

``` text
GET /api/queues/tickets/:queueId
```

ويستطيع النظام السير ضمن سلسلة التذاكر لمعرفة موقع Ticket الخاصة به.

------------------------------------------------------------------------

## المرحلة 8 --- بدء الخدمة

Manager يرسل:

``` text
POST /api/manager/activate/:queueId
```

تصبح أول Ticket مؤهلة:

``` text
serving
```

وتصبح:

``` text
queue.currentTurn
```

------------------------------------------------------------------------

## المرحلة 9 --- الانتقال إلى التالية

Manager يرسل:

``` text
PUT /api/manager/activate/:queueId
```

التذكرة الحالية:

``` text
finished
```

والتذكرة التالية:

``` text
serving
```

------------------------------------------------------------------------

## المرحلة 10 --- وجود Ticket ملغاة

إذا كانت:

``` text
A -> B -> C -> D
```

وألغى صاحب `C` تذكرته:

``` text
A -> B -> C(canceled) -> D
```

عند الوصول إلى `C` يتجاوزها النظام ويستمر إلى `D`.

------------------------------------------------------------------------

# 7. الحماية والتحقق

## JWT Authentication

يستخدم النظام JSON Web Token.

يوجد أكثر من نوع Token حسب الغرض:

``` text
authentication
confirm_account
password_changing
```

وهذا أفضل من استخدام Token واحد لكل العمليات الحساسة.

------------------------------------------------------------------------

## Role-Based Authorization

يوجد Middleware خاص بالمدير:

``` text
authorizeQueueManager
```

وMiddleware خاص بالـAdmin:

``` text
authorizeAdmin
```

------------------------------------------------------------------------

## Ownership

ليس كافياً أن يكون المستخدم Manager.

عند إدارة Queue، يتم أيضاً التحقق من:

``` text
createdBy == currentUser
```

لمنع Manager من إدارة Queue مملوكة لمدير آخر.

------------------------------------------------------------------------

## Password Hashing

تستخدم:

``` text
bcryptjs
```

لتخزين كلمات المرور بشكل Hash.

------------------------------------------------------------------------

## OTP Hashing

لا يتم تخزين OTP كنص صريح.

يتم Hash الكود قبل تخزينه.

------------------------------------------------------------------------

## Validation

تستخدم:

``` text
express-validator
```

والتسلسل هو:

``` text
Request
   ↓
Validator
   ↓
validationHandler
   ↓
Controller
   ↓
Service
```

------------------------------------------------------------------------

## Helmet

يستخدم:

``` text
helmet
```

لإضافة HTTP Security Headers شائعة.

------------------------------------------------------------------------

## CORS

تم تفعيل:

``` text
cors
```

لدعم الطلبات القادمة من تطبيقات أخرى.

------------------------------------------------------------------------

## Rate Limiting

يوجد Rate Limiting عام، بالإضافة إلى Limiters خاصة بعمليات
Authentication وOTP.

أمثلة:

``` text
Login
Register
Confirm Account
Forgot Password
Confirm OTP
Reset Password
Ticket/Queue POST operations
```

الهدف هو تقليل إساءة الاستخدام ومحاولات الإغراق.

------------------------------------------------------------------------

# 8. نقاط القوة

## 8.1 فكرة المشروع غير تقليدية

QueueLess أكثر تميزاً من مشاريع CRUD المعتادة مثل:

``` text
Task Manager
Simple Blog
Basic Todo
```

لأن فيه Domain Logic حقيقي.

------------------------------------------------------------------------

## 8.2 Linked List داخل قاعدة بيانات

استخدام:

``` text
prev
lastTicket
currentTurn
```

يخلق نموذجاً واضحاً لتسلسل التذاكر.

هذه من أكثر أجزاء المشروع تميزاً من الناحية التقنية.

------------------------------------------------------------------------

## 8.3 التفكير في Concurrency

المشروع لا يفترض أن الطلبات تصل دائماً واحداً تلو الآخر.

في إنشاء Ticket يتم استخدام:

-   توليد ObjectId مسبقاً.
-   Atomic Queue Update.
-   `$expr` للتحقق من السعة أثناء التحديث.
-   `$set` لتحديث `lastTicket`.
-   `$inc` لتحديث `currentLength`.

هذا يقلل مشاكل Concurrent Ticket Creation.

------------------------------------------------------------------------

## 8.4 Atomic State Transition

إلغاء Ticket يستخدم شرطاً من نوع:

``` text
_id
owner
status = waiting
```

ضمن عملية التحديث نفسها.

وهذا يمنع طلبين من نجاح إلغاء Ticket نفسها بالطريقة نفسها.

------------------------------------------------------------------------

## 8.5 Ownership Checks

من النقاط الجيدة جداً أن Manager لا يعتمد فقط على Role.

يتم التحقق من ملكية Queue أيضاً.

وكذلك المستخدم لا يستطيع إلغاء Ticket لمستخدم آخر لأن `owner` يدخل ضمن
شروط العملية.

------------------------------------------------------------------------

## 8.6 Authentication Flow واقعي

المشروع لا يكتفي بـ:

``` text
register
login
```

بل يحتوي على:

``` text
registration
email verification
OTP
temporary confirmation token
forgot password
password reset
JWT authentication
```

وهذا يعطي المشروع قيمة أكبر كـBackend Portfolio Project.

------------------------------------------------------------------------

## 8.7 Validation Middleware

فصل Validation عن Controllers قرار جيد.

بدلاً من وضع عشرات شروط الإدخال داخل Controller، تم استخدام:

``` text
express-validator
+
validationHandler
```

------------------------------------------------------------------------

## 8.8 Centralized Error Handling

يوجد:

``` text
AppError
asyncWrapper
globalErrorHandler
notFoundError
```

وهذا يمنع تكرار `try/catch` داخل كل Controller.

------------------------------------------------------------------------

## 8.9 فصل المسؤوليات

البنية الحالية تفصل بين:

``` text
Routes
Middlewares
Controllers
Services
Models
Config
Utils
Validators
```

وهذا مناسب جداً لمرحلة المشروع الحالية.

------------------------------------------------------------------------

# 9. نقاط الضعف والقيود

> هذه النقاط تصف النسخة المرفوعة كما كانت في ملفات المشروع، مع افتراض أن
> مشكلة `createTicket` التي تم إصلاحها بعد رفع النسخة أصبحت تعمل بشكل
> صحيح كما ذكرت. بعض النقاط هنا تحسينات هندسية مستقبلية وليست بالضرورة
> أخطاء تمنع التشغيل.

## 9.1 العمليات متعددة الـDocuments ليست Transaction واحدة

بعض العمليات تعدل أكثر من Document.

مثلاً إلغاء Ticket:

``` text
Ticket → canceled
Queue  → currentLength - 1
```

هذان تحديثان منفصلان.

إذا نجح الأول وفشل الثاني، يمكن أن تصبح البيانات غير متزامنة.

الحل الأقوى مستقبلاً:

``` text
MongoDB Transaction
```

------------------------------------------------------------------------

## 9.2 التحقق من وجود Ticket منتظرة للمستخدم

منطق منع Ticket ثانية يعتمد على فحص سابق ثم عملية إنشاء.

في حالة طلبين متزامنين جداً، يبقى احتمال Race Condition.

الحل الأقوى هو حماية الـBusiness Invariant أيضاً على مستوى Database Index
مناسب.

------------------------------------------------------------------------

## 9.3 `isCheckedBySystem` ليس Lock كاملاً

الحقل:

``` text
isCheckedBySystem
```

فكرة جيدة كمحاولة لحماية معالجة Queue من الطلبات المتزامنة، لكنه ليس
Transaction أو Distributed Lock كاملاً.

في حالة Crash أثناء العملية قد تبقى حالة Ticket بحاجة إلى Recovery.

الحل المستقبلي يمكن أن يكون:

-   Transaction.
-   Lease/lock مع expiry.
-   أو إعادة تصميم عملية Queue processing بالكامل.

------------------------------------------------------------------------

## 9.4 بعض Successor Queries تحتاج دائماً إلى Queue Filter

في بعض عمليات الانتقال إلى Ticket التالية، الاعتماد على:

``` text
prev
```

وحده أقل وضوحاً من استخدام:

``` text
prev + queue
```

لضمان أن Ticket الناتجة تابعة لنفس Queue.

------------------------------------------------------------------------

## 9.5 Pagination Validation غير مكتمل

يتم استخدام:

``` text
page
limit
```

لكن لا توجد في كل الأماكن حماية قوية من قيم مثل:

``` text
page = 0
limit = -100
limit = very large
```

من الأفضل إضافة Validators وMaximum Limit.

------------------------------------------------------------------------

## 9.6 ObjectId Validation

بعض `queueId` و`ticketId` القادمة من المستخدم لا يتم التحقق منها بشكل
صريح قبل الوصول إلى MongoDB.

من الأفضل إضافة Validators لـObjectId.

------------------------------------------------------------------------

## 9.7 Empty Arrays

في بعض Services يوجد نمط:

``` js
if (!tickets)
```

لكن MongoDB يعيد:

``` js
[]
```

عند عدم وجود نتائج، والـArray الفارغة Truthy في JavaScript.

لذلك يجب استخدام:

``` js
if (tickets.length === 0)
```

عند الحاجة إلى التعامل مع النتائج الفارغة.

------------------------------------------------------------------------

## 9.8 تحديث Queue يعتمد على Truthy Values

في بعض التحديثات يوجد نمط:

``` js
if (data[element]) {
    updates[element] = data[element];
}
```

وهذا يعني أن القيم Falsy لن تدخل في التحديث.

الأفضل استخدام:

``` js
if (data[element] !== undefined) {
    updates[element] = data[element];
}
```

------------------------------------------------------------------------

## 9.9 Rate Limiting ليس Business Rate Limiting كاملاً

الـKey الحالي يعتمد على:

``` text
IP + endpoint
```

وهذا مختلف عن قاعدة:

``` text
10 tickets per user per day
```

أو:

``` text
50 queues per manager per day
```

إذا أردت تطبيق Business Limits حقيقية، يجب أن تدخل هوية المستخدم ضمن
الـKey بعد Authentication.

------------------------------------------------------------------------

## 9.10 بعض إعدادات Rate Limiting تحتاج مراجعة

الـAuthentication limiters تستخدم Window مدته ساعة في النسخة الحالية.

كما أن مسار Registration يستخدم في الكود الحالي `loginLimiter` بدلاً من
`registerLimiter`.

هذه نقطة Configuration يجب تنظيفها قبل اعتبار Rate Limiting مطابقاً تماماً
للسياسة المقصودة.

------------------------------------------------------------------------

## 9.11 OTP لا يحتوي على Purpose صريح

نفس OTP Model يستخدم في أكثر من سياق.

من الأفضل مستقبلاً إضافة:

``` text
purpose
```

مثل:

``` text
account_confirmation
password_reset
```

حتى يكون الـOTP مرتبطاً صراحةً بالعملية التي تم إنشاؤه من أجلها.

------------------------------------------------------------------------

## 9.12 Email Transport يتم إنشاؤه لكل رسالة

الخدمة تنشئ Nodemailer Transport عند إرسال البريد.

في نظام أكبر، الأفضل إنشاء Transport واحد وإعادة استخدامه.

------------------------------------------------------------------------

## 9.13 Database connection لا تمنع Startup بالكامل

الاتصال بقاعدة البيانات يتم استدعاؤه قبل `app.listen`، لكن `index.js` لا
ينتظر الـPromise بشكل صريح قبل تشغيل HTTP Server.

في تطبيق Production أقوى، من الأفضل أن يكون Startup Sequence:

``` text
connect database
      ↓
success
      ↓
start HTTP server
```

بحيث لا يبدأ استقبال Requests قبل جاهزية قاعدة البيانات.

------------------------------------------------------------------------

## 9.14 لا توجد Automated Tests

المشروع يعتمد حالياً بشكل أساسي على الاختبار اليدوي عبر Postman.

من المفيد مستقبلاً إضافة:

``` text
Unit Tests
Integration Tests
Concurrency Tests
```

خصوصاً لأن QueueLess يحتوي على حالات Concurrency حقيقية.

------------------------------------------------------------------------

## 9.15 لا يوجد Frontend

هذا ليس عيباً في Backend Project.

لكنه يعني أن:

-   تجربة المستخدم النهائية غير موجودة.
-   Real-time updates غير مستخدمة حالياً.
-   Socket.IO/WebSocket لم تتم إضافته بعد.

Postman كافٍ لاختبار Backend نفسه.

------------------------------------------------------------------------

## 9.16 Repository Layer ليست مكتملة في النسخة الحالية

البنية المفاهيمية للمشروع تسمح بوجود Repository Layer، لكن التنفيذ
الحالي يعتمد على Mongoose مباشرة داخل Services.

هذا مقبول في هذه المرحلة التعليمية.

والتحسين المقترح بعد استقرار المشروع:

``` text
Routes
  ↓
Middlewares
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Mongoose Models
```

المهم ألا يتحول Repository إلى عشرات الدوال الصغيرة غير الضرورية.

------------------------------------------------------------------------

# 10. الاختبارات المقترحة

## Authentication

-   Register صحيح.
-   Email غير صحيح.
-   Password ضعيفة.
-   Email مكرر.
-   Register متزامن بنفس Email.
-   OTP صحيح.
-   OTP خاطئ.
-   OTP منتهي.
-   OTP مستخدم مرة ثانية.
-   Confirm Account مرتين.
-   Login صحيح.
-   Password خاطئة.
-   Login بحساب غير مؤكد.
-   JWT مفقود.
-   JWT غير صالح.
-   JWT منتهي.
-   Forgot Password.
-   Confirm Password OTP.
-   Reset Password.
-   Password Reset Token منتهي.

------------------------------------------------------------------------

## Authorization

اختبر:

``` text
Normal User → Manager endpoint
Normal User → Admin endpoint
Manager → Admin endpoint
Manager A → Queue of Manager B
User A → Ticket of User B
```

يجب أن تفشل العمليات غير المسموحة.

------------------------------------------------------------------------

## Queue

اختبر:

-   إنشاء Queue.
-   Queue بسعة صحيحة.
-   Queue بسعة صفر.
-   Queue بسعة سالبة.
-   Queue ممتلئة.
-   Queue مغلقة.
-   تحديث Queue.
-   فتح Queue.
-   إغلاق Queue.
-   تفعيل Queue فارغة.
-   تفعيل Queue مرتين.
-   Manager يحاول الوصول إلى Queue أخرى.

------------------------------------------------------------------------

## Ticket

اختبر:

-   أول Ticket.
-   ثاني Ticket.
-   ثالث Ticket.
-   `prev` صحيح.
-   Queue capacity.
-   Ticket ثانية لنفس المستخدم.
-   إلغاء Ticket.
-   إلغاء Ticket مرتين.
-   إلغاء Ticket لمستخدم آخر.
-   إلغاء Ticket بعد بدء خدمتها.
-   عدة Tickets ملغاة متتالية.
-   أول Ticket ملغاة.
-   آخر Ticket ملغاة.
-   جميع Tickets ملغاة.
-   الانتقال إلى Ticket التالية.
-   الضغط على Next بشكل متزامن.

------------------------------------------------------------------------

## Concurrency

من أهم الاختبارات في هذا المشروع:

### Concurrent Ticket Creation

إرسال عدة Requests في نفس الوقت:

``` text
User A → createTicket
User B → createTicket
User C → createTicket
User D → createTicket
```

ثم التحقق من:

``` text
linked-list integrity
lastTicket
currentLength
capacity
```

------------------------------------------------------------------------

# 11. التشغيل باستخدام Postman

يمكن اختبار المشروع بالكامل تقريباً باستخدام Postman.

## مجموعة مقترحة

أنشئ Collections:

``` text
QueueLess
├── Authentication
│   ├── Register
│   ├── Confirm Account
│   ├── Login
│   ├── Forgot Password
│   ├── Confirm OTP
│   └── Change Password
│
├── User
│   ├── Update Account
│   ├── Delete Account
│   ├── Get My Tickets
│   ├── Get Ticket in Queue
│   └── Cancel Ticket
│
├── Manager
│   ├── Create Queue
│   ├── Get Queue Tickets
│   ├── Update Queue
│   ├── Toggle Queue
│   ├── Activate Queue
│   └── Next Ticket
│
└── Admin
    ├── Get Users
    ├── Delete User
    └── Change Role
```

------------------------------------------------------------------------

# سيناريو Postman عملي

## User 1

``` text
Register
→ Confirm Account
→ Login
→ Save JWT
```

## Manager

أنشئ حساباً ثم غيّر Role بواسطة Admin إلى:

``` text
queueManager
```

ثم:

``` text
Login
→ Create Queue
→ Open Queue
```

## User 1

``` text
Login
→ Join Queue
```

## User 2

``` text
Register
→ Confirm
→ Login
→ Join Queue
```

ثم ستجد منطقياً:

``` text
Ticket 1
prev = null

Ticket 2
prev = Ticket 1
```

## Manager

``` text
Activate Queue
```

ثم:

``` text
Next Ticket
```

وتابع حالة Tickets.

------------------------------------------------------------------------

# 12. التحسينات المستقبلية

## Real-Time Queue

إضافة:

``` text
Socket.IO
```

لتحديث المستخدم مباشرة عند:

-   اقتراب دوره.
-   بدء خدمته.
-   انتقال الصف.
-   إلغاء Ticket.
-   إغلاق Queue.

------------------------------------------------------------------------

## Estimated Waiting Time

حساب وقت انتظار تقريبي بناءً على:

``` text
average service duration
+
number of tickets before user
```

------------------------------------------------------------------------

## Multiple Service Counters

بدلاً من Manager واحد يخدم Queue واحدة:

``` text
Queue
 ├── Counter 1
 ├── Counter 2
 └── Counter 3
```

------------------------------------------------------------------------

## Priority Queues

دعم:

``` text
normal
priority
emergency
```

وفق قواعد واضحة.

------------------------------------------------------------------------

## Queue Analytics

إضافة إحصائيات مثل:

``` text
Average Waiting Time
Average Service Time
Number of Served Tickets
Number of Canceled Tickets
Peak Hours
```

------------------------------------------------------------------------

## Audit Logs

تسجيل:

``` text
Who created Queue?
Who opened it?
Who closed it?
Who changed roles?
Who processed tickets?
```

------------------------------------------------------------------------

## Notification System

إضافة Email Notifications مثل:

``` text
Your turn is approaching.
Your turn has arrived.
Queue has been closed.
Ticket canceled successfully.
```

------------------------------------------------------------------------

## Automated Tests

إضافة:

``` text
Jest / Vitest / Mocha
Supertest
MongoDB test environment
```

مع Integration Tests وConcurrency Tests.

------------------------------------------------------------------------

## Repository Layer

بعد استقرار المشروع:

``` text
Controller
    ↓
Service
    ↓
Repository
    ↓
Model
```

ويجب إبقاء Business Logic داخل Services.

------------------------------------------------------------------------

## MongoDB Transactions

إضافة Transactions للعمليات التي تعدل عدة Documents وتحتاج أن تنجح أو
تفشل كوحدة واحدة.

مثال:

``` text
Cancel Ticket
    ↓
Ticket.status = canceled
    +
Queue.currentLength -= 1
```

------------------------------------------------------------------------

## Docker

إضافة:

``` text
Dockerfile
docker-compose.yml
MongoDB container
QueueLess container
```

لتسهيل Deployment.

------------------------------------------------------------------------

## OpenAPI / Swagger

توثيق الـAPI بشكل قابل للعرض والتنفيذ مباشرة من Swagger UI.

------------------------------------------------------------------------

# 13. الخلاصة

QueueLess هو Backend Project يركز على مشكلة حقيقية وهي إدارة الانتظار
الرقمي.

القيمة الأساسية للمشروع ليست عدد الـEndpoints، وإنما منطق الـDomain
الموجود خلفها.

المشروع يتجاوز:

``` text
CRUD
+
JWT
+
MongoDB
```

إلى:

``` text
Business Rules
+
Ticket Lifecycle
+
Linked List Data Modeling
+
Authorization
+
Ownership
+
OTP Authentication Flows
+
Validation
+
Rate Limiting
+
Atomic MongoDB Operations
+
Concurrency Considerations
```

أقوى جزء تقنياً هو نموذج تسلسل Tickets باستخدام `prev` مع `lastTicket`
و`currentTurn`، بالإضافة إلى محاولة معالجة مشاكل Concurrent Requests
باستخدام Atomic MongoDB Operations.

المشروع حالياً مناسب جداً كـBackend Portfolio Project تدريبي متقدم، خصوصاً
لأنه لا يعتمد على واجهة رسومية لإظهار قيمته التقنية.

في المرحلة التالية، الأفضل عدم إعادة بناء المشروع بالكامل. المسار
المنطقي هو:

``` text
Current Project
      ↓
Deploy
      ↓
Fix remaining correctness issues
      ↓
Add automated/integration tests
      ↓
Repository refactor
      ↓
MongoDB Transactions where needed
      ↓
Socket.IO / Real-Time
      ↓
SOLID / Design Patterns / DDD
```

بهذا الشكل يبقى QueueLess مشروعاً تفهمه بالكامل، وفي الوقت نفسه يصبح
قاعدة جيدة للانتقال إلى مواضيع Backend Architecture الأكثر تقدماً.

------------------------------------------------------------------------

## حالة التوثيق

هذا الملف يوثق النسخة المرفوعة من QueueLess ومساراتها الحالية، مع افتراض
أن مشكلة `createTicket` التي تم إصلاحها بعد رفع النسخة أصبحت تعمل بشكل
صحيح كما ذكرت.

أي Endpoint أو Feature لم يكن موجوداً فعلياً في الكود المرفوع لم يتم
تقديمه هنا على أنه منفذ فعلي؛ التحسينات غير المنفذة وضعت في قسم
**التحسينات المستقبلية**.
