// All "HTTP" calls of the user module and their loading signals.
// This example has no backend, so data lives in memory with a short fake delay.
// In a real app replace the bodies with AppHttp.Get / AppHttp.Post calls.
import { signal } from "@preact/signals-react";
import { ShowProgress } from "shared-lib-web";
import { AppUUID4 } from "dff-util";
import { sampleUsers } from "./data.ts";
import type { UserType } from "./types.ts";

const FAKE_DELAY_MS = 300;

let userTable: UserType[] = [...sampleUsers];

export const userListIsLoading = signal(false);
export const userSaveIsLoading = signal(false);
export const userByIdIsLoading = signal(false);
export const userDeleteIsLoading = signal(false);

/** Rows shown in the list. */
export const userRows = signal<UserType[]>([]);

function waitForFakeNetwork(resolve: () => void): void {
  setTimeout(resolve, FAKE_DELAY_MS);
}

function fakeNetworkDelay(): Promise<void> {
  return new Promise<void>(waitForFakeNetwork);
}

export async function userListCall(): Promise<void> {
  try {
    userListIsLoading.value = true;
    ShowProgress(true);
    await fakeNetworkDelay();
    userRows.value = [...userTable];
  } finally {
    userListIsLoading.value = false;
    ShowProgress(false);
  }
}

export async function userByIdCall(userId: string): Promise<UserType | undefined> {
  try {
    userByIdIsLoading.value = true;
    await fakeNetworkDelay();
    for (const user of userTable) {
      if (user.id === userId) {
        return { ...user };
      }
    }
    return undefined;
  } finally {
    userByIdIsLoading.value = false;
  }
}

/** Adds a new user (empty id) or updates an existing one. Returns the saved user. */
export async function userSaveCall(params: UserType): Promise<UserType> {
  try {
    userSaveIsLoading.value = true;
    ShowProgress(true);
    await fakeNetworkDelay();
    const now = new Date();
    const updatedAt = now.toISOString();
    const isNew = params.id.length === 0;
    if (isNew) {
      const newId = AppUUID4();
      const newUser: UserType = { ...params, id: newId, updatedAt: updatedAt };
      userTable = [...userTable, newUser];
      return newUser;
    }
    const savedUser: UserType = { ...params, updatedAt: updatedAt };
    const nextTable: UserType[] = [];
    for (const user of userTable) {
      const row = user.id === params.id ? savedUser : user;
      nextTable.push(row);
    }
    userTable = nextTable;
    return savedUser;
  } finally {
    userSaveIsLoading.value = false;
    ShowProgress(false);
  }
}

/** Removes a user. */
export async function userDeleteCall(userId: string): Promise<void> {
  try {
    userDeleteIsLoading.value = true;
    await fakeNetworkDelay();
    const nextTable: UserType[] = [];
    for (const user of userTable) {
      if (user.id !== userId) {
        nextTable.push(user);
      }
    }
    userTable = nextTable;
  } finally {
    userDeleteIsLoading.value = false;
  }
}
