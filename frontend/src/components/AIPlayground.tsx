/**
 * CodeKita - AI Engineering Playground Component
 * Interactive AI model exploration and prompt engineering
 */

import { AIModel, AIPrompt, QuizResult } from './types';

interface AIPlaygroundProps {
  models: AIModel[];
  onModelSelect: (modelId: string) => void;
  onPromptChange: (prompt: AIPrompt) => void;
}

export const AIPlayground: React.FC<AIPlaygroundProps> = ({
  models,
  onModelSelect,
  onPromptChange,
}) => {
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState<AIPrompt>({
    id: '',
    title: '',
    systemPrompt: '',
    userPrompt: '',
    temperature: 0.7,
    maxTokens: 500,
  });

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    onModelSelect(modelId);
  };

  const handlePromptSubmit = () => {
    onPromptChange({ ...prompt, id: Date.now().toString() });
    setPrompt({
      id: '',
      title: '',
      systemPrompt: '',
      userPrompt: '',
      temperature: 0.7,
      maxTokens: 500,
    });
  };

  return (
    <div className="ai-playground space-y-6">
      {/* Model Selection Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          AI Models
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {models.map((model) => (
            <button
              key={model.id}
              className={`p-3 rounded ${selectedModel === model.id 
                ? 'bg-purple-100 text-purple-600 font-medium'
                : 'text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer'}`}
              onClick={() => handleModelSelect(model.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{model.name}</span>
                <span className="text-xs text-gray-400">({model.type})</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Engineering Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Prompt Playground
        </h3>
        
        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-1">
            System Prompt
          </label>
          <textarea
            value={prompt.systemPrompt}
            onChange={(e) =>
              setPrompt({ ...prompt, systemPrompt: e.target.value })
            }
            className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-h"
            rows={3}
            placeholder="Enter system instructions for the AI model..."
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-1">
            User Prompt
          </label>
          <textarea
            value={prompt.userPrompt}
            onChange={(e) =>
              setPrompt({ ...prompt, userPrompt: e.target.value })
            }
            className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-h"
            rows={3}
            placeholder="Enter your question or task for the AI..."
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Temperature
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={prompt.temperature}
              onChange={(e) =>
                setPrompt({ ...prompt, temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-purple-600"
            />
            <span className="text-xs text-gray-400">{prompt.temperature}</span>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Max Tokens
            </label>
            <input
              type="number"
              min="1"
              max="4000"
              value={prompt.maxTokens}
              onChange={(e) =>
                setPrompt({ ...prompt, maxTokens: parseInt(e.target.value) })
              }
              className="w-full border rounded p-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-400">{prompt.maxTokens}</span>
          </div>
        </div>

        <button
          onClick={handlePromptSubmit}
          className="mt-4 w-full btn-primary"
        >
          Generate Response
        </button>
      </div>

      {/* Result Display */}
      {selectedModel && (
        <div className="mt-6 p-4 rounded bg-gray-50">
          <p className="text-gray-500 italic">
            Response from {models.find((m) => m.id === selectedModel)?.name || 'AI model'}
          </p>
          <p className="mt-2 text-sm break-all">{/* Render AI response here */}</p>
        </div>
      )}
    </div>
  );
};