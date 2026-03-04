import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/app/App";

function renderApp() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe("App", () => {
  it("shows passive interaction mode by default", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByText("Hotkeys")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /unlock interaction/i });
    expect(button).toBeDisabled();
    expect(
      screen.getByText((_, element) => element?.textContent === "Interaction mode: passive"),
    ).toBeInTheDocument();

    await user.click(button);

    expect(
      screen.getByText((_, element) => element?.textContent === "Interaction mode: passive"),
    ).toBeInTheDocument();
  });
});
