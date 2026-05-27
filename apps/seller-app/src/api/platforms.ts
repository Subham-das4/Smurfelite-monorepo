import type {
  PlatformListResponse,
  PlatformResponse,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const platformsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatforms: builder.query<PlatformResponse[], void>({
      query: () => "/platforms",
      transformResponse: (response: PlatformListResponse) => response.platforms,
      providesTags: ["Platforms"],
    }),
  }),
});

export const { useGetPlatformsQuery } = platformsApi;
