import Component from '@glimmer/component';
import jexl from 'jexl';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const transforms = [
  { answer: (questions) => questions.map((question) => question) },
];

Object.entries(transforms).map(([key, transform]) => {
  jexl.addTransform(key, transform);
});

export default class JexlBuilderComponent extends Component {
  @tracked jexlExpression = ''; // ! not sure how to do this
  @tracked astIsInvalid = false;
  lastSuccessfulAst;

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
  evaluateAst() {
    // jexl.createExpression(this.jexlExpression)._getAst();
    // return this.ast;
    try {
      const result = jexl.createExpression(this.jexlExpression)._getAst();
      this.astIsInvalid = false;
      this.lastSuccessfulAst = result; // ! not sure how to do this
    } catch (e) {
      this.astIsInvalid = true;
      console.log('🦠 Invalid AST:', e);
    }
  }

  @action
  suggestionSelected(selection, slug) {
    if (this.jexlExpression === 'null') {
      this.jexlExpression = '';
    }
    if (slug && slug !== '') {
      this.jexlExpression = this.jexlExpression.replace(slug, '');
    }

    this.jexlExpression += ' ' + selection;
    this.evaluateAst();
  }
}
