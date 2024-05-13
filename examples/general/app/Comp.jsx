export function Comp() {
    // throw new Error('Comp error thrown');
    return Math.random() > 0.5 ? <div>Comp content</div> : '';
}
