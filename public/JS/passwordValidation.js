export function validatePassword(password) {
    return {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
}

export function isPasswordValid(password){
    const result = validatePassword(password);

    return (
        result.length &&
        result.uppercase &&
        result.number &&
        result.special
    );
}