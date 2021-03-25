export const oneOf = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const sum = (a, c) => a + c;

export const mention = (userid) => `<@${userid}>`;

export const format = (num, inBlock) => `${inBlock ? '' : '`'}${new Intl.NumberFormat().format(num)}${inBlock ? '' : '`'}`;