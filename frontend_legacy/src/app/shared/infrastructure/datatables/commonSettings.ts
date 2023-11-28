export const commonSettings: DataTables.Settings = {
	language: {
		emptyTable: "No hay datos",
		info: "",
		infoEmpty: "Sin entradas",
		infoFiltered: "(Filtrado de _MAX_ entries)",
		lengthMenu: "Mostrar _MENU_",
		loadingRecords: "Cargando información...",
		processing: "Procesando...",
		search: '<i class="fa fa-search" aria-hidden="true"></i>',
		zeroRecords: "No hay registros",
		paginate: {
			first: "Primera",
			last: "Última",
			next: "Siguiente",
			previous: "Anterior",
		},
		aria: {
			sortAscending: ": activar para ordenar la columna ascendiente",
			sortDescending: ": activar para ordenar la columna descendiente",
		},
	},
  dom: '<"row"<"col-md-6 col-lg-4"f><"d-none d-md-block col-md-6 col-lg-8 text-end"l>>t<"row mt-2"<"d-none d-md-block col-md-6"i><"col-md-6"p>>',
	serverSide: true,
	processing: true,
	scrollX: true,
};
