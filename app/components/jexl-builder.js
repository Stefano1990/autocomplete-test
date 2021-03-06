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
const EQUALITIES = ['==', '!=']
const COMPARATORS = ['&&', '||'];

const transforms = [
  { answer: (questions) => questions.map((question) => question) },
];

Object.entries(transforms).map(([key, transform]) => {
  jexl.addTransform(key, transform);
});

export default class JexlBuilderComponent extends Component {
  ast
  @tracked astIsValid = true
  @tracked jexlExpression = ''
  ast
  htmlElement

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

  getRightMostAst (ast) {
    if (ast.right) {
      return this.getRightMostAst(ast.right)
    } else {
      return ast
    }
  }

  get suggestions () {
    if (!this.ast) { return this.filteredQuestions }
    const rightMostAst = this.getRightMostAst(this.ast)
    switch(this.ast.type) {
      case 'BinaryExpression':
        if (rightMostAst.type === 'Literal') {
          if(this.lastOperationIsAnAndOrOr) {
            return this.filteredQuestions
          } else {
            return COMPARATORS
          }
        }
        if (rightMostAst.type === 'Identifier') {
          if (!this.slug) {
            if (this.ast.left.type === 'FunctionCall') {
              // to the left of the comparator is a transform
              return this.possibleAnswers
            } else {
              return this.filteredQuestions
            }
          } else {
            if(this.lastOperationIsAnAndOrOr) {
              return this.filteredQuestions
            } else {
              return this.possibleAnswers
            }
          }
        }
        if (rightMostAst.type === 'FunctionCall') {
          return this.possibleAnswers
        }
        break;
      case 'FunctionCall':
        return this.possibleAnswers
      case 'Identifier':
        return this.filteredQuestions.concat(COMPARATORS);
      default:
        return this.filteredQuestions
    }
    return this.filteredQuestions
  }

  get lastOperationIsAComparator() {
    return COMPARATORS.includes(this.jexlExpression.slice(-3, -1))
  }
  get lastOperationIsAnEqualityCheck() {
    return EQUALITIES.includes(this.jexlExpression.slice(-3, -1))
  }

  get lastOperationIsAnAndOrOr() {
    const matches = this.jexlExpression.match(/(&&|\|\|)\s*$/g)
    return matches !== null
  }

  get possibleAnswers () {
    const rightMostAst = this.getRightMostAst(this.ast)
    let questionSlug

    if (this.ast.type === 'BinaryExpression') {
      if (rightMostAst && rightMostAst.args) {
        questionSlug = rightMostAst.args[0].value
      } else {
        if (this.ast.left.args) {
          questionSlug = this.ast.left.args[0].value
        }
      }
    }
    if (this.ast.type === 'FunctionCall') { // ! this is only the case after the very first transform!
      if (this.ast.args) {
        questionSlug = this.ast.args[0].value
      }
    }

    return this.filteredAnswers(questionSlug)
  }

  filteredAnswers (questionSlug) {
    if (!this.lastOperationIsAnEqualityCheck && !this.slug) { return EQUALITIES }
    if (!questionSlug) {
      return this.filteredQuestions
    }
    else {
      if (this.slug) {
        return ANSWERS[questionSlug].filter((answer) => answer.includes(this.slug)); 
      } else {
        return ANSWERS[questionSlug]
      }
    }
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
  }

  @action
  selectSuggestion(suggestion) {
    const jexlToAppend = this.appendAnswerTransformIfRequired(suggestion);
    this.jexlExpression = this.jexlExpression.replace(
      new RegExp(this.slug + '\\s*$'),
      ''
    )
    this.jexlExpression = this.jexlExpression += jexlToAppend
    this.recomputeAst()
    this.focusTextArea()
  }

  appendAnswerTransformIfRequired(jexlToAppend) {
    return QUESTIONS.includes(jexlToAppend) ? jexlToAppend += '|answer ' : jexlToAppend += ' '
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
  pickFirstSuggestion() {
    this.selectSuggestion(this.suggestions[0])
  }
}
