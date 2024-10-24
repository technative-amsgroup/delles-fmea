interface Window {
    showSaveFilePicker?: (
        options?: SaveFilePickerOptions
    ) => Promise<FileSystemFileHandle>;
}

interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{
        description: string;
        accept: Record<string, string[]>;
    }>;
}

interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | ArrayBuffer | ArrayBufferView | Blob): Promise<void>;
    close(): Promise<void>;
}
