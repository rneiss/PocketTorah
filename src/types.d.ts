declare module "*.svg" {
  const svg: import("react").FC<import("react-native-svg").SvgProps>;
  export default svg;
}

declare module "*?res" {
  const id: number;
  export default id;
}
