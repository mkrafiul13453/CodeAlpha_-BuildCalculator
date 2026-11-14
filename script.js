"use strict";

const expressionDisplay = document.querySelector("#expression");
const resultDisplay = document.querySelector("#result");
const keypad = document.querySelector(".keypad");

let expression = "";
let justCalculated = false;
let hasError = false;

const operators = new Set(["+", "-", "*", "/"]);
const operatorSymbols = { "*": "×", "/": "÷", "-": "−" };

function tokenize(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    if (character === " ") {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(character)) {
      const numberMatch = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (!numberMatch) return { error: "Invalid number" };
      index += numberMatch[0].length;
      tokens.push({ type: "number", value: Number(numberMatch[0]) });
      continue;
    }

    if (operators.has(character) || character === "%") {
      tokens.push({ type: character === "%" ? "percent" : "operator", value: character });
      index += 1;
      continue;
    }

    return { error: "Invalid expression" };
  }

  return { tokens };
}

function toPostfix(tokens) {
  const output = [];
  const stack = [];
  let expectsOperand = true;
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "u-": 3 };

  for (const token of tokens) {
    if (token.type === "number") {
      if (!expectsOperand) return { error: "Invalid expression" };
      output.push(token);
      expectsOperand = false;
      continue;
    }

    if (token.type === "percent") {
      if (expectsOperand) return { error: "Invalid expression" };
      output.push(token);
      continue;
    }

    const unary = expectsOperand && token.value === "-";
    if (expectsOperand && !unary) return { error: "Invalid expression" };
    const operator = unary ? "u-" : token.value;

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (precedence[top] > precedence[operator] || (precedence[top] === precedence[operator] && !unary)) {
        output.push({ type: "operator", value: stack.pop() });
      } else {
        break;
      }
    }
    stack.push(operator);
    expectsOperand = true;
  }

  if (expectsOperand) return { error: "Incomplete expression" };
  while (stack.length > 0) output.push({ type: "operator", value: stack.pop() });
  return { postfix: output };
}

function tidyNumber(value) {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(12));
}

function calculate(source) {
  if (!source) return { error: "Enter an expression" };
  const lexical = tokenize(source);
  if (lexical.error) return lexical;

  const parsed = toPostfix(lexical.tokens);
  if (parsed.error) return parsed;

  const values = [];
  for (const token of parsed.postfix) {
    if (token.type === "number") {
      values.push(token.value);
    } else if (token.type === "percent") {
      values.push(tidyNumber(values.pop() / 100));
    } else if (token.value === "u-") {
      values.push(tidyNumber(-values.pop()));
    } else {
      const right = values.pop();
      const left = values.pop();
      let value;

      switch (token.value) {
        case "+":
          value = left + right;
          break;
        case "-":
          value = left - right;
          break;
        case "*":
          value = left * right;
          break;
        case "/":
          if (right === 0) return { error: "Cannot divide by zero" };
          value = left / right;
          break;
        default:
          return { error: "Invalid expression" };
      }
      values.push(tidyNumber(value));
    }
  }

  if (values.length !== 1 || !Number.isFinite(values[0])) {
    return { error: "Result is out of range" };
  }
  return { value: values[0] };
}

function formatNumber(value) {
  return String(value);
}

function prettyExpression(value) {
  return value.replace(/[*/-]/g, (operator) => operatorSymbols[operator]);
}

function updateDisplay(errorMessage) {
  expressionDisplay.textContent = expression ? prettyExpression(expression) : "0";
  resultDisplay.classList.toggle("is-error", Boolean(errorMessage));

  if (errorMessage) {
    resultDisplay.textContent = errorMessage;
  } else if (!expression) {
    resultDisplay.textContent = "Ready";
  } else {
    const preview = calculate(expression);
    resultDisplay.textContent = preview.value === undefined ? "—" : formatNumber(preview.value);
  }

  const last = expression.slice(-1);
  document.querySelectorAll(".key--operator").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.value === last);
  });
}

function currentNumberStart() {
  let index = expression.length - 1;
  while (index >= 0 && /[0-9.]/.test(expression[index])) index -= 1;
  if ((expression[index] === "+" || expression[index] === "-") && /[eE]/.test(expression[index - 1] || "")) {
    index -= 1;
  }
  if (/[eE]/.test(expression[index] || "")) {
    index -= 1;
    while (index >= 0 && /[0-9.]/.test(expression[index])) index -= 1;
  }
  return index + 1;
}

function enterDigit(digit) {
  if (hasError) {
    expression = "";
    hasError = false;
  }
  if (justCalculated) {
    expression = "";
    justCalculated = false;
  }
  if (expression.endsWith("%")) expression += "*";

  const start = currentNumberStart();
  const current = expression.slice(start);
  if (digit === "." && current.includes(".")) return;
  if (digit === "." && (current === "" || current === "-")) expression += "0";
  if (current === "0" && digit !== ".") {
    expression = expression.slice(0, start) + digit;
  } else {
    expression += digit;
  }
  updateDisplay();
}

function enterOperator(operator) {
  if (hasError) {
    expression = "";
    hasError = false;
  }
  if (justCalculated) justCalculated = false;
  const last = expression.slice(-1);

  if (!expression) {
    if (operator === "-") expression = "-";
    else return;
  } else if (operators.has(last)) {
    const unaryMinus = last === "-" && (expression.length === 1 || operators.has(expression[expression.length - 2]));
    if (unaryMinus) {
      if (operator === "-" || expression.length === 1) return;
      expression = expression.slice(0, -2) + operator;
    } else {
      expression = expression.slice(0, -1) + operator;
    }
  } else if (last === ".") {
    expression += `0${operator}`;
  } else if (last !== "%") {
    expression += operator;
  } else {
    expression += operator;
  }
  updateDisplay();
}

function enterPercent() {
  if (justCalculated) justCalculated = false;
  const last = expression.slice(-1);
  if (/[0-9]/.test(last)) {
    expression += "%";
    updateDisplay();
  }
}

function toggleSign() {
  if (hasError) {
    expression = "";
    hasError = false;
  }
  if (justCalculated) justCalculated = false;

  if (!expression || operators.has(expression.slice(-1))) {
    if (expression.endsWith("-") && (expression.length === 1 || operators.has(expression[expression.length - 2]))) {
      return;
    }
    expression += "-";
    updateDisplay();
    return;
  }

  if (expression.endsWith("%")) return;
  const start = currentNumberStart();
  if (start === expression.length) return;
  const before = expression.slice(0, start);
  const number = expression.slice(start);
  if (before.endsWith("-") && (before.length === 1 || operators.has(before[before.length - 2]))) {
    expression = before.slice(0, -1) + number;
  } else {
    expression = before + "-" + number;
  }
  updateDisplay();
}

function backspace() {
  if (!expression) return;
  expression = expression.slice(0, -1);
  justCalculated = false;
  hasError = false;
  updateDisplay();
}

function clear() {
  expression = "";
  justCalculated = false;
  hasError = false;
  updateDisplay();
}

function equals() {
  const outcome = calculate(expression);
  if (outcome.error) {
    hasError = true;
    updateDisplay(outcome.error);
    return;
  }

  expression = formatNumber(outcome.value);
  justCalculated = true;
  hasError = false;
  updateDisplay();
}

function handleAction(action) {
  switch (action) {
    case "clear":
      clear();
      break;
    case "backspace":
      backspace();
      break;
    case "percent":
      enterPercent();
      break;
    case "sign":
      toggleSign();
      break;
    case "equals":
      equals();
      break;
    default:
      break;
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action) handleAction(button.dataset.action);
  else if (/^\d$/.test(button.dataset.value)) enterDigit(button.dataset.value);
  else if (button.dataset.value === ".") enterDigit(".");
  else enterOperator(button.dataset.value);
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    enterDigit(event.key);
  } else if (event.key === ".") {
    event.preventDefault();
    enterDigit(".");
  } else if (operators.has(event.key)) {
    event.preventDefault();
    enterOperator(event.key);
  } else if (event.key === "%") {
    event.preventDefault();
    enterPercent();
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    equals();
  } else if (event.key === "Backspace") {
    event.preventDefault();
    backspace();
  } else if (event.key === "Escape") {
    event.preventDefault();
    clear();
  }
});

updateDisplay();
