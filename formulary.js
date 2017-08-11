
var Node = {
  VARIABLE_NODE: 1,
  CONSTANT_NODE: 2,
  ADDITION_NODE: 3,
  MULTIPLICATION_NODE: 4,
  EXPONENTIATION_NODE: 5,
  FUNCTION_NODE: 6,
  PLACEHOLDER_NODE: 7
};

function ExpressionNode() {}

ExpressionNode.prototype.isVariable = function() { return false; };
ExpressionNode.prototype.simplify = function(parent) { return this; };


/**
 * An ExpressionNode that stores a constant value
 */
function ConstantExpressionNode(value) {
  ExpressionNode.call(this);
  this.value = value;
}

ConstantExpressionNode.prototype = Object.create(ExpressionNode.prototype);


ConstantExpressionNode.prototype.getValue = function()
{
  return this.value;
};
  
ConstantExpressionNode.prototype.setValue = function(value)
{
  this.value =  value;
};

ConstantExpressionNode.prototype.getType = function()
{
  return Node.CONSTANT_NODE;
};

ConstantExpressionNode.prototype.setVariable = function(name, value)
{
  // Nothing to be done here...
};

ConstantExpressionNode.prototype.getDepth = function()
{
  return 1;
};

ConstantExpressionNode.prototype.count = function()
{
  return 1;
};

ConstantExpressionNode.prototype.getChildNodes = function()
{
  return [];
};

ConstantExpressionNode.prototype.toLatex = function()
{
  return "\\mathrm{" + this.value + "}";
};

ConstantExpressionNode.prototype.evaluatesConstant = function(variables)
{
  return true;
};

ConstantExpressionNode.prototype.clone = function()
{
  return new ConstantExpressionNode(value);
};

ConstantExpressionNode.prototype.toString = function()
{
  return this.value;
};

ConstantExpressionNode.prototype.getValueString = function()
{
  return this.value;
};

ConstantExpressionNode.prototype.accept = function(visitor)
{
  visitor.visitConstantExpressionNode(this);    
};

ConstantExpressionNode.prototype.acceptRecursive = function(visitor)
{
  visitor.visitConstantExpressionNode(this);  
};

function VariableExpressionNode(name)
{
  ExpressionNode.call(this);
  this.name = name;
  this.valueSet = false;
}

VariableExpressionNode.prototype = Object.create(ExpressionNode.prototype);


VariableExpressionNode.prototype.isVariable = function()
{
  return true;
};

VariableExpressionNode.prototype.getName = function()
{
  return this.name;
};

VariableExpressionNode.prototype.toString = function()
{
  return this.name;
};

VariableExpressionNode.prototype.getType = function()
{
  return Node.VARIABLE_NODE;
};

VariableExpressionNode.prototype.setValue = function(value)
{
  this.value = value;
  this.valueSet = true;
};

VariableExpressionNode.prototype.getValue = function()
{
  if (this.valueSet)
    return this.value;
  else
    throw "Variable '" + name + "' was not initialized.";
};

VariableExpressionNode.prototype.setVariable = function(name, value)
{
  if (this.name.equals(name)) this.setValue(value);
};

VariableExpressionNode.prototype.getDepth = function()
{
  return 1;
};

VariableExpressionNode.prototype.count = function()
{
  return 1;
};

VariableExpressionNode.prototype.getChildNodes = function()
{
  return [];
};

VariableExpressionNode.prototype.toLatex = function()
{
  return this.name;
};

VariableExpressionNode.prototype.evaluatesConstant = function(variables)
{
  return !(this.name in variables);
};

VariableExpressionNode.prototype.clone = function()
{
  var node = new VariableExpressionNode(this.name);
  if (this.valueSet) node.setValue(this.value);
  return node;
};

VariableExpressionNode.prototype.accept = function(visitor)
{
  visitor.visit(this);
};

VariableExpressionNode.prototype.acceptRecursive = function(visitor)
{
  visitor.visit(this);
};

function SequenceExpressionNode(a, positive) {
  ExpressionNode.call(this);
  this.terms = [];  
  if ((a != null) && (positive != null))
    this.terms.push({positive: positive, expression: a});
}

SequenceExpressionNode.prototype = Object.create(ExpressionNode.prototype);

SequenceExpressionNode.prototype.add = function(a, positive)
{
  this.terms.push({positive: positive, expression: a});
};
  
SequenceExpressionNode.prototype.pack = function()
{
  this.terms.filter(function(t) { return (typeof t.expression !== 'undefined');});
};

SequenceExpressionNode.prototype.makeString = function(posSep, negSep)
{
  var str = '';
  var head = true;
  this.terms.forEach(function(t)
  {
    if (!head || !t.positive)
      str +=  (t.positive) ? posSep : negSep;
    str += '(' + t.expression.toString() + ')';
    head = false;
  });

  return str;
};

SequenceExpressionNode.prototype.setVariable = function(name, value)
{
  this.terms.forEach(function(t) {
      t.expression.setVariable(name, value);
  });
};

SequenceExpressionNode.prototype.getDepth = function()
{
  var maxdepth = 0;
  this.terms.forEach(function(t) {
    var d = t.expression.getDepth();
    if (d > maxdepth) maxdepth = d;
  });
  return maxdepth + 1;
};

SequenceExpressionNode.prototype.count = function()
{
  var sum = 1;
  this.terms.forEach(function(t) {
    sum += t.expression.count();
  });
  return sum;
};

SequenceExpressionNode.prototype.getChildNodes = function()
{
  var children = [];

  this.terms.forEach(function(t) {
      children.push(t.expression);
  });

  return children;
};

SequenceExpressionNode.prototype.evaluatesConstant = function(variables)
{
  this.terms.forEach(function(t) {
    if (!t.expression.evaluatesConstant(variables)) return false;
  });
  return true;
};

function AdditionExpressionNode(a, positiveA, b, positiveB) {
  SequenceExpressionNode.call(this, a, positiveA);
  if ((typeof(b) != undefined) && (typeof(positiveB) != undefined))
    this.add(b, positiveB);
}

AdditionExpressionNode.prototype = Object.create(SequenceExpressionNode.prototype);


AdditionExpressionNode.prototype.getType = function()
{
  return Node.ADDITION_NODE;
};

AdditionExpressionNode.prototype.getValue = function()
{
  var sum = 0.0;
  this.terms.forEach(function(t) {
    if (t.positive)
      sum += t.expression.getValue();
    else
      sum -= t.expression.getValue();
  });
  return sum;
};

AdditionExpressionNode.prototype.toLatex = function()
{
  var str = '';
  var first = true;
  var self = this;
  this.terms.forEach(function(t) {
    var brackets = self.needBrackets(t.expression, first, t.positive);
    if (!first || !t.positive) str += t.positive?'+':'-';
    if (brackets)
      str += '(';
    str += t.expression.toLatex();
    if (brackets)
      str += ')';
    
    first = false;
  });
  return str;
};

AdditionExpressionNode.prototype.clone = function()
{
  var c = null; 
  this.terms.forEach(function(t) {
    if (c==null)
      c = new AdditionExpressionNode(t.expression.clone(), t.positive);
    else
      c.add(t.expression.clone(), t.positive);
  });
  
  return c;
};

AdditionExpressionNode.prototype.toString = function()
{
  return this.makeString("+", "-");
};
  
AdditionExpressionNode.prototype.needBrackets = function(child, isleft, positive)
{    
  var childType = child.getType();

  if (childType == Node.CONSTANT_NODE || childType == Node.VARIABLE_NODE)
    return false;

  if (childType == Node.ADDITION_NODE)
    return (!isleft) || (!positive);
  
  return false;
};
  
AdditionExpressionNode.prototype.accept = function(visitor)
{
  visitor.visitAdditionExpressionNode(this);    
};

AdditionExpressionNode.prototype.acceptRecursive = function(visitor)
{
  visitor.visitAdditionExpressionNode(this);  
  this.terms.forEach(function(t) {
    t.expression.acceptRecursive(visitor);
  });
};

function MultiplicationExpressionNode(a, positiveA, b, positiveB) {
  SequenceExpressionNode.call(this, a, positiveA);
  if ((b != null) && (positiveB != null))
    this.add(b, positiveB);
}

MultiplicationExpressionNode.prototype = Object.create(SequenceExpressionNode.prototype);

MultiplicationExpressionNode.prototype.toString = function()
{
  return this.makeString("*", "/");
};

MultiplicationExpressionNode.prototype.getType = function()
{
  return ExpressionNode.MULTIPLICATION_NODE;
};

MultiplicationExpressionNode.prototype.getValue = function()
{
  var prod = 1.0;
  this.terms.forEach(function(t) {
      if (t.positive)
        prod *= t.expression.getValue();
      else
        prod /= t.expression.getValue();
  });
  return prod;
};

MultiplicationExpressionNode.prototype.toLatex = function()
{
  var numerator = '';
  var denominator = '';
  
  this.terms.forEach(function(t) {
    var brackets = t.expression.getType() == Node.ADDITION_NODE;
    var buf = '';
    if (brackets)
      buf += '(';
    buf += t.expression.toLatex();
    if (brackets)
      buf += ')';
    if (t.positive) numerator += buf;
    else denominator += buf;
  });
  
  if (numerator == "") numerator = "1";
  
  if (denominator == "") return numerator;
  return "{"+numerator+"}/{"+denominator+"}";
};

MultiplicationExpressionNode.prototype.clone = function()
{
  var c = null;
  this.terms.forEach(function(t) {
    if (c==null)
      c = new MultiplicationExpressionNode(t.expression.clone(), t.positive);
    else
      c.add(t.expression.clone(), t.positive);
  });
  
  return c;
};

MultiplicationExpressionNode.prototype.accept = function(visitor)
{
  visitor.visitMultiplicationExpressionNode(this);    
};

MultiplicationExpressionNode.prototype.acceptRecursive = function(visitor)
{
  visitor.visitMultiplicationExpressionNode(this);  
  this.terms.forEach(function(t) {
    t.expression.acceptRecursive(visitor);
  });
};


function ExponentiationExpressionNode(base, exponent) {
  ExpressionNode.call(this);
  this.base = base;
  this.exponent = exponent;
}

ExponentiationExpressionNode.prototype = Object.create(ExpressionNode.prototype);

ExponentiationExpressionNode.prototype.toString = function()
{
  return "(" + this.base.toString() + ")^(" + this.exponent.toString() + ")";
};

ExponentiationExpressionNode.prototype.getBase = function()
{
  return this.base;
};

ExponentiationExpressionNode.prototype.setBase = function(base)
{
  this.base = base;
};

ExponentiationExpressionNode.prototype.getExponent = function()
{
  return this.exponent;
};

ExponentiationExpressionNode.prototype.setExponent = function(exponent)
{
  this.exponent = exponent;
};

ExponentiationExpressionNode.prototype.getType = function()
{
  return Node.EXPONENTIATION_NODE;
};

ExponentiationExpressionNode.prototype.getValue = function()
{
  return Math.pow(this.base.getValue(), this.exponent.getValue());
};

ExponentiationExpressionNode.prototype.setVariable = function(name, value)
{
  this.base.setVariable(name, value);
  this.exponent.setVariable(name, value);
};

ExponentiationExpressionNode.prototype.getDepth = function()
{
  return 1 + Math.max(this.base.getDepth(), this.exponent.getDepth());
};

ExponentiationExpressionNode.prototype.count = function()
{
  return 1 + this.base.count() + this.exponent.count();
};

ExponentiationExpressionNode.prototype.getChildNodes = function()
{
  return [this.base, this.exponent];
};

ExponentiationExpressionNode.prototype.toLatex = function()
{
  var brackets = !((this.base.getType() == Node.CONSTANT_NODE) || (this.base.getType() == Node.VARIABLE_NODE));

  var str = '';
  str += '{';
  if (brackets)
    str += '\\left(';
  str += this.base.toJqMath();
  if (brackets)
    str += '\\right)';
  str += "}^{" + this.exponent.toLatex() + '}';

  return str;
};

ExponentiationExpressionNode.prototype.evaluatesConstant = function(variables)
{
  return (this.base.evaluatesConstant(variables) && this.exponent.evaluatesConstant(variables));
};

ExponentiationExpressionNode.prototype.clone = function()
{
  var n_base = this.base.clone();
  var n_exponent = this.exponent.clone();
  return new ExponentiationExpressionNode(n_base, n_exponent);
};

ExponentiationExpressionNode.prototype.accept = function(visitor)
{
  visitor.visitExponentiationExpressionNode(this);
};

ExponentiationExpressionNode.prototype.acceptRecursive = function(visitor)
{
  visitor.visitExponentiationExpressionNode(this);
  this.base.acceptRecursive(visitor);
  this.exponent.acceptRecursive(visitor);
};

MathFunctions = {
  Id : {
    SIN: 1,
    COS: 2,
    TAN: 3,
    ASIN: 4,
    ACOS: 5,
    ATAN: 6,
  
    // SEC: 7,
    // COSEC: 8,
    // COT: 9,
//   
    // SINH: 10,
    // COSH: 11,
    // TANH: 12,
    // ASINH: 13,
    // ACOSH: 14,
    // ATANH: 15,
//   
    // SECH: 16,
    // CSCH: 17,
    // COTH: 18,
  
    SQRT: 19,
    EXP: 20,
  
    LN: 21,
    // LOG: 22,
    // LOG2: 23,
//   
    // ERF: 24,
    // ERFC: 25
  },
  Names: ["sin", "cos", "tan", "asin", "acos", "atan",
          "sec", "cosec", "cot",
          "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
          "sech", "csch", "coth",    
          "sqrt", "exp",    
          "ln", "log", "log2",    
          "erf", "erfc"],
          
  stringToFunction: function(str)
  {
    str = str.toUpperCase();
    if (typeof MathFunctions.Id[str] !== undefined) 
      return MathFunctions.Id[str];
    else
      return -1;
  },

  functionToString: function(func)
  {
    return MathFunctions.Names[func - 1];
  }
};

function FunctionExpressionNode(func, argument) {
  ExpressionNode.call(this);
  this.func = func;
  this.argument = argument;
};

FunctionExpressionNode.prototype = Object.create(ExpressionNode.prototype);

FunctionExpressionNode.prototype.getFunction = function()
{
  return this.func;
};

FunctionExpressionNode.prototype.getArgument = function()
{
  return this.argument;
};

FunctionExpressionNode.prototype.setArgument = function(argument)
{
  this.argument = argument;
};

FunctionExpressionNode.prototype.getType = function()
{
  return Node.FUNCTION_NODE;
};

FunctionExpressionNode.prototype.toString = function()
{
  return this.functionToString(this.func) + "(" + this.argument.toString() + ")";
};


FunctionExpressionNode.prototype.getValue = function()
{
  switch (this.func)
  {
    case MathFunctions.Id.SIN:
      return Math.sin(this.argument.getValue());
    case MathFunctions.Id.COS:
      return Math.cos(this.argument.getValue());
    case MathFunctions.Id.TAN:
      return Math.tan(this.argument.getValue());
    case MathFunctions.Id.ASIN:
      return Math.asin(this.argument.getValue());
    case MathFunctions.Id.ACOS:
      return Math.acos(this.argument.getValue());
    case MathFunctions.Id.ATAN:
      return Math.atan(this.argument.getValue());
    // case MathFunctions.Id.SEC:
      // return 1 / Math.cos(this.argument.getValue());
    // case MathFunctions.Id.COSEC:
      // return 1 / Math.sin(this.argument.getValue());
    // case MathFunctions.Id.COT:
      // return Functions.cot(this.argument.getValue());
    // case MathFunctions.Id.SINH:
      // return Functions.sinh(this.argument.getValue());
    // case MathFunctions.Id.COSH:
      // return Functions.cosh(this.argument.getValue());
    // case MathFunctions.Id.TANH:
      // return Functions.tanh(this.argument.getValue());
    // case MathFunctions.Id.ASINH:
      // return Functions.asinh(this.argument.getValue());
    // case MathFunctions.Id.ACOSH:
      // return Functions.acosh(this.argument.getValue());
    // case MathFunctions.Id.ATANH:
      // return Functions.atanh(this.argument.getValue());
    // case MathFunctions.Id.SECH:
      // return 1.0 / Functions.cosh(this.argument.getValue());
    // case MathFunctions.Id.CSCH:
      // return 1.0 / Functions.sinh(this.argument.getValue());
    // case MathFunctions.Id.COTH:
      // return 1.0 / Functions.tanh(this.argument.getValue());
    case MathFunctions.Id.SQRT:
      return Math.sqrt(this.argument.getValue());
    case MathFunctions.Id.EXP:
      return Math.exp(this.argument.getValue());
    case MathFunctions.Id.LN:
      return Math.log(this.argument.getValue());
    // case MathFunctions.Id.LOG:
      // return Math.log(this.argument.getValue()) * 0.43429448190325182765;
    // case MathFunctions.Id.LOG2:
      // return Math.log(this.argument.getValue()) * 1.442695040888963407360;
    // case MathFunctions.Id.ERF:
      // return Functions.erf(this.argument.getValue());
    // case MathFunctions.Id.ERFC:
      // return Functions.erfc(this.argument.getValue());
  }
  // This is never reached
  return 0;
};

FunctionExpressionNode.prototype.setVariable = function(name, value)
{
  this.argument.setVariable(name, value);
};

FunctionExpressionNode.prototype.getDepth = function()
{
  return 1 + this.argument.getDepth();
};

FunctionExpressionNode.prototype.count = function()
{
  return 1 + this.argument.count();
};

FunctionExpressionNode.prototype.getChildNodes = function()
{
  return [this.argument];
};

FunctionExpressionNode.prototype.toLatex = function()
{
  // Special case for negation function
  switch (this.func)
  {
    case MathFunctions.Id.EXP:
      return "\\e^{" + this.argument.toLatex() + "}";
    case MathFunctions.Id.LOG:
      return "\\log_{10}" + lbr + this.argument.toLatex() + rbr;
    case MathFunctions.Id.LOG2:
      return "\\log_{2}" + lbr + this.argument.toLatex() + rbr;
    case MathFunctions.Id.SQRT:
      return "\sqrt{" + this.argument.toLatex() + "}";
    default:
      return "\\mathrm{" + this.functionToString(this.func) + "}\left(" + this.argument.toLatex() + "\right)";
  }
};

FunctionExpressionNode.prototype.evaluatesConstant = function(variables)
{
  return this.argument.evaluatesConstant(variables);
};

FunctionExpressionNode.prototype.clone = function()
{
  return new FunctionExpressionNode(this.func, this.argument.clone());
};

FunctionExpressionNode.prototype.accept = function(visitor)
{
  visitor.visitFunctionExpressionNode(this);
};

FunctionExpressionNode.prototype.acceptRecursive = function(visitor)
{
  visitor.visitFunctionExpressionNode(this);
  this.argument.acceptRecursive(visitor);
};

function PlaceholderExpressionNode(name) {
  ExpressionNode.call(this);
  this.name = name;
}

PlaceholderExpressionNode.prototype = Object.create(ExpressionNode.prototype);

PlaceholderExpressionNode.prototype.getName = function()
{
  return this.name;
};

PlaceholderExpressionNode.prototype.toString = function()
{
  return this.name;
};

PlaceholderExpressionNode.prototype.getType = function()
{
  return Node.PLACEHOLDER_NODE;
};

PlaceholderExpressionNode.prototype.getValue = function()
{
  return 0;
};

PlaceholderExpressionNode.prototype.setVariable = function(name, value)
{};

PlaceholderExpressionNode.prototype.getDepth = function()
{
  return 1;
};

PlaceholderExpressionNode.prototype.count = function()
{
  return 1;
};

PlaceholderExpressionNode.prototype.getChildNodes = function()
{
  return children;
};

PlaceholderExpressionNode.prototype.toJqMath = function()
{
  return name;
};

PlaceholderExpressionNode.prototype.evaluatesConstant = function(variables)
{
  return true;
};

PlaceholderExpressionNode.prototype.clone = function()
{

  return new PlaceholderExpressionNode(this.name);
};

PlaceholderExpressionNode.prototype.accept = function(visitor)
{
  visitor.visitPlaceholderExpressionNode(this);
};

PlaceholderExpressionNode.prototype.acceptRecursive = function(visitor)
{
  visitor.visitPlaceholderExpressionNode(this);
};

function ExpressionNodeVisitor() {}

ExpressionNodeVisitor.prototype.visitVariableExpressionNode = function(node)
{};

ExpressionNodeVisitor.prototype.visitConstantExpressionNode = function(node)
{};

ExpressionNodeVisitor.prototype.visitAdditionExpressionNode = function(node)
{};

ExpressionNodeVisitor.prototype.visitMultiplicationExpressionNode = function(node)
{};

ExpressionNodeVisitor.prototype.visitExponentiationExpressionNode = function(node)
{};

ExpressionNodeVisitor.prototype.visitFunctionExpressionNode = function(node)
{};

ExpressionNodeVisitor.prototype.visitPlaceholderExpressionNode = function(node)
{};


function EquationSolver(lhs, rhs, variables)
{
  this.lhs = lhs;
  this.rhs = rhs;
  this.variables = variables;
  this.solvable = true;
  this.solved = false;
  this.updateSolved();
}

EquationSolver.prototype.updateSolved = function()
{
  if (this.lhs.getType() == Node.VARIABLE_NODE)
  { 
    if (this.lhs.getName() in variables)
      this.solved = true;
    else
      this.solvable = false;
  }
};


EquationSolver.prototype.solveStep = function()
{
  this.lhs.visit(this);
};

EquationSolver.prototype.visitVariableExpressionNode = function(node)
{
  this.updateSolved();
};

EquationSolver.prototype.visitConstantExpressionNode = function(node)
{
  this.solvable = false;
};

EquationSolver.prototype.visitAdditionExpressionNode = function(node)
{
  var varNode = null;
  var constNodes = [];
  var self = this;
  node.terms.forEach(function(t) {
    if (!t.expression.evaluatesConstant(self.variables))
    {
      if (varNode==null)
      {
        varNode = t;
      }
      else
      {
        this.solvable = false;
        return;  
      }
    }
    else
    {
      constNodes.push(t);
    }
  });
  
  if (varNode == null)
  {
    this.solvable = false;
    return;  
  }
 
  var newRhs = new AdditionExpressionNode(this.rhs, varNode.positive);
  constNodes.forEach(function(t) {
    newRhs.add(t.expression, varNode.positive ? !t.positive : t.positive);
  });
  
  this.rhs = newRhs;
  this.lhs = varNode.expression;
};

EquationSolver.prototype.visitMultiplicationExpressionNode = function(node)
{
  var varNode = null;
  var constNodes = [];
  var self = this;
  node.terms.forEach(function(t) {
    if (!t.expression.evaluatesConstant(self.variables))
    {
      if (varNode==null)
      {
        varNode = t;
      }
      else
      {
        this.solvable = false;
        return;  
      }
    }
    else
    {
      constNodes.push(t);
    }
  });
  
  if (varNode == null)
  {
    this.solvable = false;
    return;  
  }
 
  var newRhs = new MultiplicationExpressionNode(this.rhs, varNode.positive);
  constNodes.forEach(function(t) {
    newRhs.add(t.expression, varNode.positive ? !t.positive : t.positive);
  });
  
  this.rhs = newRhs;
  this.lhs = varNode.expression;
};

EquationSolver.prototype.visitExponentiationExpressionNode = function(node)
{};

EquationSolver.prototype.visitFunctionExpressionNode = function(node)
{};

EquationSolver.prototype.visitPlaceholderExpressionNode = function(node)
{};

function Equation(lhs, rhs)
{
  this.lhs = lhs;
  this.rhs = rhs;
}

Equation.prototype.solve = function(varname)
{
  var vararr = {};
  variables[varname] = true;
  var varside, constside;
  
  if (this.lhs.evaluatesConstant(variables) && !this.rhs.evaluatesConstant(variables))
  {
    constside = this.lhs;
    varside = this.rhs;
  }
  else if (!this.lhs.evaluatesConstant(variables) && this.rhs.evaluatesConstant(variables))
  {
    constside = this.rhs;
    varside = this.lhs;
  }
  else
    return false;
    
  
};
