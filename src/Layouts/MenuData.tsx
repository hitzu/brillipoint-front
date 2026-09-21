// const menuItems = [
//   { label: "Products", type: "HEADER" },
//   {
//     type: "HASHMENU",
//     id: "product-list",
//     label: "Products",
//     link: "/application/product-list",
//     dataPage: "product-list",
//   },
//   {
//     type: "HASHMENU",
//     id: "product-add",
//     label: "Add New Product",
//     link: "/application/product-add",
//     dataPage: "product-add",
//   },
// ];

const menuItems = [
  {
    type: "HASHMENU",
    id: 0,
    label: "Agenda",
    icon: "ph-duotone ph-calendar-blank",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "slots",
        label: "Agenda",
        link: "/agenda",
        dataPage: "contracts-list",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 2,
    label: "Contratos",
    icon: "ph-duotone ph-calendar-blank",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "slots",
        label: "Listado de Contratos",
        link: "/contracts",
        dataPage: "contracts-list",
      },
      {
        id: "contracts-add",
        label: "Agregar contrato",
        link: "/contracts-add",
        dataPage: "contracts-add",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 2,
    label: "Productos",
    icon: "ph-duotone ph-shopping-cart",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "product-list",
        label: "Listado de productos",
        link: "/product-list",
        dataPage: "product-list",
      },
      {
        id: "product-edit",
        label: "Editar producto",
        link: "/product-edit",
        dataPage: "product-edit",
      },
      {
        id: "product-add",
        label: "Agregar producto",
        link: "/product-add",
        dataPage: "product-add",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 3,
    label: "Paquetes",
    icon: "ph-duotone ph-package",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "package-list",
        label: "Listado de paquetes",
        link: "/package-list",
        dataPage: "package-list",
      },
      {
        id: "package-edit",
        label: "Editar paquete",
        link: "/package-edit",
        dataPage: "package-edit",
      },
      {
        id: "package-add",
        label: "Agregar paquete",
        link: "/package-add",
        dataPage: "package-add",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 4,
    label: "Terminos y condiciones",
    icon: "ph-duotone ph-file-text",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "terms-and-conditions-list",
        label: "Listado de terminos y condiciones",
        link: "/terms-and-conditions-list",
        dataPage: "terms-and-conditions-list",
      },
      {
        id: "terms-and-conditions-edit",
        label: "Editar termino y condicion",
        link: "/terms-and-conditions-edit",
        dataPage: "terms-and-conditions-edit",
      },
      {
        id: "terms-and-conditions-add",
        label: "Agregar termino y condicion",
        link: "/terms-and-conditions-add",
        dataPage: "terms-and-conditions-add",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 5,
    label: "Promociones",
    icon: "ph-duotone ph-percent",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "promotions-list",
        label: "Listado de Promociones",
        link: "/promotions-list",
        dataPage: "promotions-list",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 6,
    label: "Proveedores",
    icon: "ph-duotone ph-truck",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "provider-list",
        label: "Listado de proveedores",
        link: "/provider-list",
        dataPage: "provider-list",
      },
      {
        id: "provider-edit",
        label: "Editar proveedor",
        link: "/provider-edit",
        dataPage: "provider-edit",
      },
      {
        id: "provider-add",
        label: "Agregar proveedor",
        link: "/provider-add",
        dataPage: "provider-add",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 7,
    label: "Eventos",
    icon: "ph-duotone ph-confetti",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "event-list",
        label: "Listado de eventos",
        link: "/event-list",
        dataPage: "event-list",
      },
      {
        id: "event-edit",
        label: "Editar evento",
        link: "/event-edit",
        dataPage: "event-edit",
      },
      {
        id: "event-add",
        label: "Agregar evento",
        link: "/event-add",
        dataPage: "event-add",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 8,
    label: "Fotos",
    icon: "ph-duotone ph-images",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "photos-list",
        label: "Listado de fotos",
        link: "/photos-list",
        dataPage: "photos-list",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 9,
    label: "Extras",
    icon: "ph-duotone ph-gift",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "extras-list",
        label: "Listado de extras",
        link: "/extras-list",
        dataPage: "extras-list",
      },
      {
        id: "extras-add",
        label: "Agregar extra",
        link: "/extras-add",
        dataPage: "extras-add",
      },
    ],
  },
  {
    type: "HASHMENU",
    id: 10,
    label: "Expos",
    icon: "ph-duotone ph-calendar-blank",
    dataPage: null,
    link: "#",
    submenu: [
      {
        id: "expo-bebe-experiences",
        label: "Expo tu bebe Photobooth",
        link: "/expo-bebe?brand=3",
        dataPage: "expo-bebe",
      },
      {
        id: "expo-bebe-lusso",
        label: "Expo tu bebe Salon de fiestas",
        link: "/expo-bebe?brand=4",
        dataPage: "expo-bebe",
      },
      {
        id: "expo-bebe-glitter-bar",
        label: "Expo tu bebe Glitter Bar",
        link: "/expo-bebe?brandId=1",
        dataPage: "expo-bebe",
      },
    ],
  },
];

export { menuItems };
