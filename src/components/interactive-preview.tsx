import { useState, type FC } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const InteractivePreview: FC = () => {
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);

  // Toggle knowledge check
  const toggleKnowledgeCheck = () => setShowKnowledgeCheck(!showKnowledgeCheck);

  // Handle answer selection
  const handleAnswerSelect = (selected: number) => {
    setAnswer(selected);
  };

  return (
    <div className="space-y-6">
      {/* Knowledge Check Section */}
      {showKnowledgeCheck ? (
        <div className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)]">
          <h3 className="text-lg font-medium text-text-primary mb-4">
            Knowledge Check
          </h3>

          <p className="mb-4">What does journey contain?</p>

          <fieldset>
            {['["LEARN", "BUILD"]', '[\"learn\", \"build\"]', '"LEARN BUILD"'].map(
              (option, index) => {
                const isCorrect = answer === index;
                return (
                  <label
                    key={index}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 font-mono text-xs transition-colors",
                      isCorrect ? "border-primary/60 bg-primary/5" : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <input
                      type="radio"
                      name="preview"
                      checked={answer === index}
                      onChange={() => handleAnswerSelect(index)}
                      className="accent-[rgb(var(--ck-primary))]"
                    />
                    {option}
                  </label>
                );
              }
            )}
          </fieldset>
        </div>
      ) : (
        <Button
          onClick={toggleKnowledgeCheck}
          className="w-full justify-center px-4 py-2 rounded-full bg-accent-primary text-background font-medium hover:bg-accent-hover transition-colors"
        >
          Knowledge Check · Test Your Understanding
        </Button>
      )}
    </div>
  );
};