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
  it("toggles overlay visibility", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByText("Hotkeys")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /hide overlay/i });
    expect(
      screen.getByText((_, element) => element?.textContent === "Overlay state: visible"),
    ).toBeInTheDocument();

    await user.click(button);

    expect(screen.getByRole("button", { name: /show overlay/i })).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "Overlay state: hidden"),
    ).toBeInTheDocument();
  });
});
