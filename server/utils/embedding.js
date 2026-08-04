

import { pipeline } from "@xenova/transformers";

let extractor = null;

export async function loadEmbeddingModel() {
    if (!extractor) {

        console.log("\nLoading BGE model...");

        const start = Date.now();

        extractor = await pipeline(
            "feature-extraction",
            "Xenova/bge-small-en-v1.5"
        );

        const end = Date.now();

        console.log(
            `BGE model loaded in ${end - start} ms`
        );
    }

    return extractor;
}

export async function generateEmbedding(text) {

    console.log("\nInside generateEmbedding()");

    const extractor = await loadEmbeddingModel();

    console.log("Generating embedding...");

    const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
    });

    console.log("Embedding generated.");

    return Array.from(output.data);
}