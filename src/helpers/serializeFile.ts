function serializeFile(file: any) {
    return {
        ...file,
        size: Number(file.size),
    };
}

export default serializeFile