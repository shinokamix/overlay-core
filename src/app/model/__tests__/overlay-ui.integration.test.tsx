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
  it("renders chat shell and settings modal flow", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByRole("heading", { name: /ai chat mock/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByRole("dialog", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /mcp servers/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /hotkeys/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /skills/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /providers/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /providers/i }));
    expect(screen.getByRole("heading", { name: /providers/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(screen.queryByRole("dialog", { name: /settings/i })).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /message/i }), "hello");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText(/mock response:/i)).toBeInTheDocument();
  });
});
