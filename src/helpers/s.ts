export default function s(string: string, number: number) {
	return `${string}${number === 1 ? "" : "s"}`;
}
