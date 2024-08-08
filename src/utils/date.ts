export const oneYearFromNow = () =>{
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
}
export const oneMonthFromNow = () =>{
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
}
export const fifteenMinutesFromNow = () =>{
    return new Date(Date.now() + 1000 * 60 * 15);
}
export const thirtyDaysFromNow = () =>{
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 30);
}
export const ONE_DAY_MS = 1000 * 60 * 60 * 24;