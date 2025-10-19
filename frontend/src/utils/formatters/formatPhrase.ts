export function formatPhrase(phrase: string): string {
    if (!phrase) return "";
    return phrase
        .replace(/_/g, " & ")
        .split(" ")
        .map(word =>
            word.length > 0
                ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                : ""
        )
        .join(" ");
}