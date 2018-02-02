export interface IOptions {
    oss: {
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
        region: string;
    };
    destination?: string;
    match?: string[];
    baseUrl: string;
}
export declare type callback = (error?: Error) => void | undefined;
export default class Serve {
    private _store;
    private _destination;
    private _match;
    private _baseUrl;
    constructor({oss, destination, match, baseUrl}: IOptions);
    push(root: string, cb?: callback): void;
    pull(root: string, cb?: callback): void;
    private _filterObjects(list);
    private _keyToObject(key);
    private _checkFileMata(file, object);
    private _storeList(...params);
    private _storeHead(...params);
    private _storeGet(...params);
    private _storePut(...params);
    private _storeDelete(...params);
}
