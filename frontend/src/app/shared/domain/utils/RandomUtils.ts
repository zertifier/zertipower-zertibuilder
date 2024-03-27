export function generateToken() {

    const date = new Date();

    const randomNumber = Math.floor(Math.random() * 10000);

    const token = date.getTime().toString() + randomNumber.toString();

    return token;
    
}