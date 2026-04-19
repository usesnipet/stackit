import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";

type InputProps = {
  label: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  mask?: boolean;
};

export function Input({
  label,
  initialValue = "",
  onChange,
  onSubmit,
  placeholder,
  mask = false,
}: InputProps) {
  const [value, setValue] = useState<string>(initialValue);
  const [cursorPos, setCursorPos] = useState<number>(initialValue.length);

  useEffect(() => {
    setCursorPos(value.length);
  }, [ value ]);

  useInput((input, key) => {
    if (key.return) {
      if (onSubmit) onSubmit(value);
      return;
    }
    if (key.leftArrow) {
      setCursorPos(pos => Math.max(0, pos - 1));
      return;
    }
    if (key.rightArrow) {
      setCursorPos(pos => Math.min(value.length, pos + 1));
      return;
    }
    if (key.backspace || key.delete) {
      if (cursorPos === 0) return;
      const newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
      setValue(newValue);
      setCursorPos(pos => Math.max(0, pos - 1));
      if (onChange) onChange(newValue);
      return;
    }
    if (input.length === 1 && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPos) + input + value.slice(cursorPos);
      setValue(newValue);
      setCursorPos(pos => pos + 1);
      if (onChange) onChange(newValue);
      return;
    }
  }, { isActive: true });

  function renderValue() {
    const displayed = mask ? "•".repeat(value.length) : value;
    const left = displayed.slice(0, cursorPos);
    const right = displayed.slice(cursorPos);
    return (
      <>
        <Text color="cyan">{left}</Text>
        <Text inverse color="cyan">{right.length > 0 ? right[0] : " "}</Text>
        <Text color="cyan">{right.slice(1)}</Text>
      </>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>{label}</Text>
      <Box>
        {value.length === 0 && placeholder ? (
          <Text dimColor>{placeholder}</Text>
        ) : (
          renderValue()
        )}
      </Box>
    </Box>
  );
}