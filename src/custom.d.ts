declare module '*.json' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any;
  export default value;
}

// Declaración para topojson-client
declare module 'topojson-client' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function feature(topology: any, o: any): any;
} 