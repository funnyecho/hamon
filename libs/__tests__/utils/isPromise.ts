/**
 * Created by samhwang1990@gmail.com.
 */

export default function isPromise(v: any): boolean {
    if (!v) return false;
    
    try {
        return typeof v['then'] === 'function';
    } catch (_) {
        return false;
    }
}