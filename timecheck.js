function isAfter() {
    const requestTime = new Date();
    // return ((requestTime.getHours() >= 13 && requestTime.getMinutes() >= 15)
    //     || (requestTime.getHours() > 13));
    return ((requestTime.getHours() === 13 ? requestTime.getMinutes() >= 9 : requestTime.getHours() > 13));
}

console.log(isAfter());