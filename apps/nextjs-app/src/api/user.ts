import {
  UserProfileResponse,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";
import { setUser } from "@/store";

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /////////////////////
    // Get current user profile
    getUser: build.query<UserProfileResponse, void>({
      query: () => "/users/me",
      onQueryStarted: async (_, { queryFulfilled, dispatch }) => {
        try {
          const { data } = await queryFulfilled;
          // Keep the user slice in sync with the fetched profile
          dispatch(setUser(data as any));
        } catch (error) {
          console.error(error);
        }
      },
      providesTags: ["UserProfile"],
    }),

    /////////////////////
    // Update current user profile (name, picture)
    updateMe: build.mutation<UserProfileResponse, UpdateUserRequest>({
      query: (body) => ({
        url: "/users/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["UserProfile"],
    }),
  }),
});

export const { useGetUserQuery, useUpdateMeMutation } = userApi;
