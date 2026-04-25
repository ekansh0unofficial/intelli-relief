import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import alertReducer from "./slices/alertSlice";
import assignmentReducer from "./slices/assignmentSlice";
import shelterReducer from "./slices/shelterSlice";
import volunteerReducer from "./slices/volunteerSlice";
import weatherReducer from "./slices/weatherSlice";
import dashboardReducer from "./slices/dashboardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alerts: alertReducer,
    assignments: assignmentReducer,
    shelters: shelterReducer,
    volunteers: volunteerReducer,
    weather: weatherReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
