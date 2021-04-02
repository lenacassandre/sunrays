export default function checkErrorType(error: any, alt: string) {
	return typeof error === "string" ? error : alt;
}