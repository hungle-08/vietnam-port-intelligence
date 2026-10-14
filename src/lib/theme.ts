export type Theme='light'|'dark';
export const THEME_STORAGE_KEY='vpi-theme';
export function readSavedTheme(storage:Pick<Storage,'getItem'>):Theme{
 try{return storage.getItem(THEME_STORAGE_KEY)==='light'?'light':'dark';}catch{return 'dark';}
}
export function saveTheme(theme:Theme,storage:Pick<Storage,'setItem'>){
 try{storage.setItem(THEME_STORAGE_KEY,theme);}catch{/* Theme switching also works without persistent storage. */}
}
// Runs before paint. Preserve explicit light preference, otherwise use ocean dark.
export const THEME_BOOTSTRAP=`(function(){var dark=true;try{dark=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})!=='light'}catch(e){}document.documentElement.classList.toggle('dark',dark)})();`;
