export default () => ({
    // ... các config khác
    cookie: {
        httpOnly: true,
        secure: false, // Đặt true nếu dùng HTTPS
        sameSite: 'lax',
        path: '/',
    },
});
