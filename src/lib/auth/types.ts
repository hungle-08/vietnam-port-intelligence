export type AccountUser={id:string;name:string;email:string;role:'user'|'admin'};
export type AuthState={error?:'invalid'|'unavailable'|'limited'|'duplicate';fields?:Partial<Record<'email'|'name'|'password',string>>;values?:{email:string;name:string}};
