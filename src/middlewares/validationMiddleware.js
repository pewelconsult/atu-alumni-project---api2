// src/middlewares/validationMiddleware.js

// Validate email format
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

// Validate phone number (Ghana format)
export const validatePhone = (phone) => {
    // Ghana phone numbers: +233... or 0...
    const phoneRegex = /^(\+233|0)[2-5][0-9]{8}$/;
    return phoneRegex.test(phone);
};

// Validate registration data
export const validateRegistration = (req, res, next) => {
    const { email, password, first_name, last_name } = req.body;

    // Check required fields
    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({
            success: false,
            error: "Email, password, first name, and last name are required"
        });
    }

    // Validate email
    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: "Invalid email format"
        });
    }

    // Validate password
    if (!validatePassword(password)) {
        return res.status(400).json({
            success: false,
            error: "Password must be at least 8 characters with uppercase, lowercase, and number"
        });
    }

    // Validate names
    if (first_name.length < 2 || last_name.length < 2) {
        return res.status(400).json({
            success: false,
            error: "First name and last name must be at least 2 characters"
        });
    }

    next();
};

// Validate login data
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: "Email and password are required"
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: "Invalid email format"
        });
    }

    next();
};

// Validate profile update data
export const validateProfileUpdate = (req, res, next) => {
    const { email, phone_number } = req.body;

    // Validate email if provided
    if (email && !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: "Invalid email format"
        });
    }

    // Validate phone if provided
    if (phone_number && !validatePhone(phone_number)) {
        return res.status(400).json({
            success: false,
            error: "Invalid phone number format. Use Ghana format: +233XXXXXXXXX or 0XXXXXXXXX"
        });
    }

    next();
};