interface productRequest {
    "id": string,
    "name": string,
    "price": number,
    "tags": string[]
}

function isProductRequest(obj:any): obj is productRequest {
    return obj.name !== undefined &&
            obj.price !== undefined &&
            obj.tags !== undefined
}

function validate(payload: productRequest): boolean {
    const check = typeof payload.name === "string" &&
            payload.name.length <= 40 &&
            typeof payload.price === "number" &&
            payload.price > 0
    if (Array.isArray(payload.tags)) {
        let isValid = true;
        for (let i = 0; i < payload.tags.length; i++) {
            if (typeof payload.tags[i] !== "string") {
                isValid = false;
                break;
            }
            if (payload.tags[i] === "") {
                isValid = false;
                break;
            }
        }
        return check && isValid;
    }
    return false;
}

export {
    productRequest,
    isProductRequest,
    validate
}