/* eslint-disable prettier/prettier */
import Component from '@glimmer/component';
import jexl from 'jexl';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

// ! Hardcoded for MVP
const QUESTIONS = [
  '"test-question-1"',
  '"something-question-2"',
  '"else-question-3"',
];
const ANSWERS = {
  'test-question-1': ['"yes"', '"no"'],
  'something-question-2': ['"1"', '"2"', '"3"'],
  'else-question-3': ['"maybe?"'],
};
const COMPARATORS = ['==', '!=', '&&', '||'];

const transforms = [
  { answer: (questions) => questions.map((question) => question) },
];

Object.entries(transforms).map(([key, transform]) => {
  jexl.addTransform(key, transform);
});

export default class JexlBuilderComponent extends Component {
  ast
  astIsInvalid
  @tracked jexlExpression = ''
  ast

  get slug () {
    const matches = this.jexlExpression.match(/(\w+)$/g);
    return matches ? matches[0] : null
  }

  get filteredQuestions () {
    if (!this.slug) {
      return QUESTIONS;
    }
    return QUESTIONS.filter((q) => q.includes(this.slug));
  }

  rightMostAstType (ast) {
    if (!ast.right) {
      return ast
    }
    this.rightMostAstType(ast.right)
  }

  get suggestions () {
    if (!this.ast) { return this.filteredQuestions }
    switch(this.ast.type) {
      case 'BinaryExpression':
        const rightMostAstType = this.rightMostAstType(this.ast)
        console.log("🦠 this.rightMostAstType(this.ast):", rightMostAstType)
        debugger
        if (this.ast.right.type === 'Literal') {
          return this.lastOperationIsAComparator ? this.possibleAnswers : COMPARATORS
        }
        if (this.ast.right.type === 'Identifier') {
          return this.filteredQuestions;
        }
        if (this.ast.right.type === 'FunctionCall') {
          return this.lastOperationIsAComparator ? this.possibleAnswers : COMPARATORS
        }
        break;
      case 'FunctionCall':
        return this.lastOperationIsAComparator ? this.possibleAnswers : COMPARATORS
      case 'Identifier':
        return COMPARATORS;
      default:
        return this.filteredQuestions
    }
    return this.filteredQuestions
  }

  get lastOperationIsAComparator() {
    return COMPARATORS.includes(this.jexlExpression.slice(-3, -1))
  }

  get possibleAnswers () {
    if (this.ast.type === 'FunctionCall') {
      const lastArg = this.ast.args[this.ast.args.length - 1];
      if (lastArg.type === 'Literal') {
        return ANSWERS[lastArg.value];
      }
    }

    if (this.ast.type === 'BinaryExpression') {
      if (this.ast.right.args) {
        return ANSWERS[this.ast.right.args[0].value];
      }
    }

    return this.filteredQuestions
  }

  @action
  recomputeAst() {
    try {
      const result = jexl.createExpression(this.jexlExpression)._getAst();
      this.astIsValid = true;
      this.ast = result;
    } catch (e) {
      this.astIsValid = false;
    }
    console.log("🦠 this.ast:", this.ast)
  }

  @action
  selectSuggestion(suggestion) {
    const jexlToAppend = this.appendAnswerTransformIfRequired(suggestion);
    this.jexlExpression = this.jexlExpression += jexlToAppend
    this.recomputeAst()
  }

  appendAnswerTransformIfRequired(jexlToAppend) {
    return QUESTIONS.includes(jexlToAppend) ? jexlToAppend += '|answer ' : jexlToAppend += ' '
  }

  /*
  @tracked jexlExpression = ''; // ! not sure how to do this
  @tracked astIsInvalid = false;
  lastSuccessfulAst;
  htmlElement;

  get ast() {
    try {
      const result = jexl.createExpression(this.jexlExpression)._getAst();
      this.lastSuccessfulAst = result; // ! not sure how to do this
      return result;
    } catch (e) {
      return this.lastSuccessfulAst;
    }
  }

  @action
  setElementRef(element) {
    this.htmlElement = element;
  }

  focusTextArea() {
    this.htmlElement.focus();
    this.htmlElement.setSelectionRange(
      this.jexlExpression.length,
      this.jexlExpression.length
    );
  }

  @action
  evaluateAst() {
    // jexl.createExpression(this.jexlExpression)._getAst();
    // return this.ast;
    try {
      const result = jexl.createExpression(this.jexlExpression)._getAst();
      this.astIsInvalid = false;
      this.lastSuccessfulAst = result; // ! not sure how to do this
    } catch (e) {
      this.astIsInvalid = true;
    }
  }

  @action
  suggestionSelected(selection, slug) {
    if (slug && slug !== '') {
      // this.jexlExpression = this.jexlExpression.replace(slug, ''); // !TODO Replace last match for this!
      debugger;
      this.jexlExpression = this.jexlExpression.replace(
        new RegExp(slug + '$'),
        ''
      ); // !TODO Replace last match for this!
    }

    this.jexlExpression += ' ' + selection;
    // this.evaluateAst();
    this.focusTextArea();
  }

  @action
  pickFirstSuggestion() {
    console.log("🦠 'in here':", 'in here');
  }
  */
}
