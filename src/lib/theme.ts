export type Theme='light'|'dark';
export const THEME_STORAGE_KEY='vpi-theme';
export function readSavedTheme(storage:Pick<Storage,'getItem'>):Theme{
 try{return storage.getItem(THEME_STORAGE_KEY)==='dark'?'dark':'light';}catch{return 'light';}
}
export function saveTheme(theme:Theme,storage:Pick<Storage,'setItem'>){
 try{storage.setItem(THEME_STORAGE_KEY,theme);}catch{/* Theme switching also works without persistent storage. */}
}
// Runs in <head> before paint; no OS preference override because Light is default.
export const THEME_BOOTSTRAP=`(function(){var dark=false;try{dark=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==='dark'}catch(e){}document.documentElement.classList.toggle('dark',dark)})();`;
