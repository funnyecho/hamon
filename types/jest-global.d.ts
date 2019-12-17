/**
 * Created by samhwang1990@gmail.com.
 */

interface IClosureNameMeta {
    given: string | string[];
    should: string | string[];
}

declare function noop(): void;

declare function closureName(meta: IClosureNameMeta): string;
declare function closureName(given: string[] | string, should: string[] | string): string;
declare function closureName(should: string[] | string): string;
declare function closureToDo(): void;

declare function suiteName(given: string[] | string): string;