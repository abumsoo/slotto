import Markdown from "react-markdown";

const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li'];

export function MarkdownContent({ content }: { content: string }) {
  return (
    <Markdown
      allowedElements={ALLOWED_ELEMENTS}
      unwrapDisallowed={true}
      components={{
        a: ({ href, children }) => {
          if (href && /^javascript:/i.test(href)) {
            return <>{children}</>;
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </Markdown>
  );
}
