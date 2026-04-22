here// netlify/functions/update-cache.js

const fs = require('fs').promises;
const path = require('path');

// هذا هو المفتاح السري الذي يجب أن يعرفه سيرفرك الخلفي فقط
const SECRET_KEY = 'Nalsh-To-Netlify-Bridge-!@#$9876';

exports.handler = async function(event, context) {
    // 1. الحماية: لا تقبل إلا طلبات POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. الحماية: التحقق من المفتاح السري
    const providedKey = event.headers['x-auth-token'];
    if (providedKey !== SECRET_KEY) {
        console.error('Invalid or missing secret key.');
        return { statusCode: 403, body: 'Forbidden: Access Denied' };
    }

    try {
        const body = JSON.parse(event.body);
        const { filename, content, folder } = body;

        if (!filename || !content) {
            return { statusCode: 400, body: 'Bad Request: Missing filename or content.' };
        }

        // تحديد مسار الكتابة داخل مجلد النشر
        // يمثل './' مجلد الواجهة الأمامية المنشور
        let targetDir = path.join(process.cwd(), 'cache');
        
        // إذا تم تحديد مجلد فرعي (مثل stores)
        if (folder) {
            targetDir = path.join(targetDir, folder);
        }

        // التأكد من وجود المجلد، وإنشاءه إذا لم يكن موجوداً
        await fs.mkdir(targetDir, { recursive: true });

        const targetPath = path.join(targetDir, filename);

        // كتابة المحتوى في الملف
        await fs.writeFile(targetPath, content);

        console.log(`Cache updated successfully: ${targetPath}`);
        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'success', message: `File ${filename} updated.` }),
        };

    } catch (error) {
        console.error('Error updating cache:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ status: 'error', message: error.message }),
        };
    }
};
