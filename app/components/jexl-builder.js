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
  @tracked jexlExpression = 'null';
  @tracked ast = {};

  // get jexlExpression() {
  //   return '';
  // }

  @action
  evaluateAst() {
    // console.log('🦠 this.jexlExpression:', this.jexlExpression);
    try {
      const result = jexl.createExpression(this.jexlExpression)._getAst();
      this.ast = result;
      return JSON.stringify(result, null, 2);
    } catch (e) {
      console.log('🦠 e:', e);
      return '';
    }
  }

  @action
  suggestionSelected(selection) {
    if (this.jexlExpression === 'null') {
      this.jexlExpression = '';
    }
    this.jexlExpression += ' ' + selection;
  }
}
