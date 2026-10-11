import { authClient } from "@/lib/auth-client";
import { BetterFetchError } from "better-auth/client";
import useSWRMutation from "swr/mutation";

type SignInUser = Parameters<typeof authClient.signIn.social<never>>[0];
type SignInSocialArg = { arg: SignInUser };

type SignInSocialData = Awaited<ReturnType<typeof authClient.signIn.social<never>>>;
type SignInSocialError = BetterFetchError;
type SignInFetcher = (_key: string, { arg }: SignInSocialArg) => Promise<SignInSocialData>;

const key = "/sign-in/social";

const fetcher: SignInFetcher = async (_key, { arg }) => {
  const { data, error } = await authClient.signIn.social(arg);
  if (error) throw error;
  if (!data) throw new Error("signIn.social no devolvió datos");
  return data;
};

export const useSignIn = () => {
  return useSWRMutation<SignInSocialData, SignInSocialError, typeof key, SignInUser>(key, fetcher);
};
