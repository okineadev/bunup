
//#region \0dts:/home/okineadev/bunup/tests/.project/src/services/api.d.ts
declare function missingReturnType(): {
	name: string
	status: string
};
declare function fetchData(url: string);

//#endregion
//#region \0dts:/home/okineadev/bunup/tests/.project/src/utils/helpers.d.ts
declare const formatData: (data: any) => {
	formatted: any
};

//#endregion
export { fetchData, formatData, missingReturnType };