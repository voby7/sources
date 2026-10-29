export type IsString<T> = T extends string ? true : false;

export type ReadonlyKeys<T> = { [K in keyof T]: T[K] };

export type NestedArray<T> = T | NestedArray<T>[];

export type EventName<T extends string> = `on${Capitalize<T>}`;

export type Nullable<T> = T extends any ? T | null : never;

export type First<T extends any[]> = T extends [infer U, ...any[]] ? U : never;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type UserId = string & { readonly brand: unique symbol };
export type PresetName = string & { readonly brand: unique symbol };
export type GuildId = string & { readonly brand: unique symbol };
export type RoleId = string & { readonly brand: unique symbol };
export type MessageId = string & { readonly brand: unique symbol };

export type BrandedId<T extends string> = T & { readonly brand: unique symbol };

export type DatabaseRecord<T> = {
  _id?: string;
} & T;

export type QueryResult<T> = T | null;

export type AsyncResult<T> = Promise<T>;

export type Maybe<T> = T | undefined;

export type Either<L, R> = { left: L } | { right: R };

export type Option<T> = Some<T> | None;

export interface Some<T> {
  readonly _tag: "Some";
  readonly value: T;
}

export interface None {
  readonly _tag: "None";
}

export const createUserId = (id: string): UserId => id as UserId;

export const createPresetName = (name: string): PresetName =>
  name as PresetName;

export type ConfigShape = {
  log_webhook: string;
  owner_id: string;
  required_server_id: string;
  required_role_id: string;
  server_invite: string;
  token: string;
  client_id: string;
};

export type MappedConfig<T> = {
  [K in keyof T]: T[K] extends string ? BrandedId<string> : T[K];
};

export type RecursiveConfig = NestedArray<ConfigShape>;

export type TemplateEvent<T extends string> = `event_${T}`;

export type DistributiveNullable<T> = T extends any ? T | null : never;
