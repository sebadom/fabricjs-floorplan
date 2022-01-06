export type CustomObject<T extends {}> = T & {
  custom: any;
};
