import { useState } from 'react';
export function useLocalState(key, initial){
 const [value,setValue]=useState(()=>{try{const raw=sessionStorage.getItem(key);return raw?JSON.parse(raw):initial}catch{return initial}});
 const update=next=>{setValue(prev=>{const v=typeof next==='function'?next(prev):next;try{sessionStorage.setItem(key,JSON.stringify(v))}catch{} return v;});};
 return [value,update];
}
