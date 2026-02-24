"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { OnboardingState, OnboardingHabit } from "@/lib/onboarding-types";
import { HabitCard } from "./HabitCard";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingHabitConfig({
  state,
  updateState,
  onNext,
  onBack,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"task" | "counter">("task");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newCategory, setNewCategory] = useState("fitness");

  const isOriginal = state.setupTier === "original";
  const canAdd = state.setupTier === "added";
  const canToggle = state.setupTier !== "original";

  const updateHabit = (index: number, updates: Partial<OnboardingHabit>) => {
    const habits = [...state.habits];
    habits[index] = { ...habits[index], ...updates };
    updateState({ habits });
  };

  const removeHabit = (index: number) => {
    const habits = state.habits.filter((_, i) => i !== index);
    updateState({ habits });
  };

  const addHabit = () => {
    if (!newName.trim()) return;
    const habit: OnboardingHabit = {
      name: newName.trim(),
      blockType: newType,
      target: newType === "counter" && newTarget ? Number(newTarget) : undefined,
      unit: newType === "counter" && newUnit ? newUnit : undefined,
      isHard: false,
      isActive: true,
      category: newCategory,
      sortOrder: state.habits.length + 1,
    };
    updateState({ habits: [...state.habits, habit] });
    setNewName("");
    setNewTarget("");
    setNewUnit("");
    setShowAddForm(false);
  };

  const activeCount = state.habits.filter((h) => h.isActive).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {isOriginal
            ? "Your habits"
            : canAdd
              ? "Customize & add habits"
              : "Customize habits"}
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isOriginal
            ? "The classic 75 HARD habits. All are required every day."
            : "Toggle habits on/off and set hard vs soft rules."}
        </p>
      </div>

      {/* Habit list */}
      <div className="space-y-2">
        {state.habits.map((habit, i) => (
          <HabitCard
            key={`${habit.name}-${i}`}
            habit={habit}
            mode={
              isOriginal ? "readonly" : canAdd ? "full" : "toggle"
            }
            onToggleActive={(active) => updateHabit(i, { isActive: active })}
            onToggleHard={(hard) => updateHabit(i, { isHard: hard })}
            onRemove={
              canAdd && habit.sortOrder > 7 ? () => removeHabit(i) : undefined
            }
          />
        ))}
      </div>

      {/* Add custom habit form */}
      {canAdd && (
        <div>
          {showAddForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3 p-4 rounded-lg border border-dashed border-primary/40 bg-primary/5"
            >
              <div className="space-y-2">
                <Label>Habit name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Journaling, Cold Shower"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newType}
                    onValueChange={(v) => setNewType(v as "task" | "counter")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task (check off)</SelectItem>
                      <SelectItem value="counter">
                        Counter (track a number)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newCategory}
                    onValueChange={setNewCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="mind">Mind</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newType === "counter" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <Input
                      type="number"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="e.g., min, pages"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={addHabit}
                  disabled={!newName.trim()}
                  size="sm"
                >
                  Add Habit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4" />
              Add Custom Habit
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        {activeCount} active habit{activeCount !== 1 ? "s" : ""}
        {!isOriginal && (
          <>
            {" "}
            &middot;{" "}
            {state.habits.filter((h) => h.isActive && h.isHard).length} hard
          </>
        )}
      </p>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={activeCount === 0}
          size="lg"
          className="gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
