import Markdown from "react-markdown";

const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li'];

export function MarkdownContent({ content, onPostLink }: { content: string; onPostLink?: (postId: number) => void }) {
  return (
    <Markdown
      allowedElements={ALLOWED_ELEMENTS}
      unwrapDisallowed={true}
      components={{
        ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        a: ({ href, children }) => {
          if (href && /^javascript:/i.test(href)) {
            return <>{children}</>;
          }
          if (href && href.startsWith('#post-')) {
            return (
              <a
                href={href}
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  const postId = parseInt(href.slice('#post-'.length));
                  if (onPostLink && !isNaN(postId)) {
                    onPostLink(postId);
                  } else {
                    const el = document.getElementById(href.slice(1));
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('animate-highlight-fade');
                      setTimeout(() => el.classList.remove('animate-highlight-fade'), 6000);
                    }
                  }
                }}
              >
                {children}
              </a>
            );
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
