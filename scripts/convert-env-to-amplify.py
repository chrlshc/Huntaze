#!/usr/bin/env python3
"""
Convert environment variables to AWS Amplify format
Usage: python3 scripts/convert-env-to-amplify.py
"""

import json
import sys
import subprocess
from pathlib import Path

def generate_secret(length=32):
    """Generate a secure random secret"""
    result = subprocess.run(
        ['openssl', 'rand', '-base64', str(length)],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

def generate_hex_secret(length=16):
    """Generate a hex secret"""
    result = subprocess.run(
        ['openssl', 'rand', '-hex', str(length)],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

def load_template():
    """Load the template JSON file"""
    template_path = Path('.env.amplify.template.json')
    
    if not template_path.exists():
        print("❌ Template file not found: .env.amplify.template.json")
        sys.exit(1)
    
    with open(template_path, 'r') as f:
        return json.load(f)

def prompt_for_value(key, current_value):
    """Prompt user for a value"""
    if '<GENERATE_WITH_openssl_rand_-base64_32>' in current_value:
        print(f"\n🔑 Generating {key}...")
        return generate_secret(32)
    
    if '<GENERATE_WITH_openssl_rand_-hex_16>' in current_value:
        print(f"\n🔑 Generating {key}...")
        return generate_hex_secret(16)
    
    if current_value.startswith('<') and current_value.endswith('>'):
        print(f"\n📝 {key}")
        print(f"   Current: {current_value}")
        value = input(f"   Enter value (or press Enter to skip): ").strip()
        return value if value else current_value
    
    return current_value

def main():
    print("🚀 AWS Amplify Environment Variables Converter")
    print("=" * 60)
    print()
    
    # Load template
    template = load_template()
    env_vars = template['environmentVariables'].copy()
    
    print("This script will help you configure environment variables.")
    print("Press Enter to skip optional values.")
    print()
    
    # Ask if user wants interactive mode
    interactive = input("Do you want interactive mode? (y/n): ").lower() == 'y'
    
    if interactive:
        print("\n" + "=" * 60)
        print("INTERACTIVE MODE")
        print("=" * 60)
        
        for key, value in env_vars.items():
            new_value = prompt_for_value(key, value)
            env_vars[key] = new_value
    else:
        # Auto-generate secrets only
        print("\n🔑 Auto-generating secrets...")
        for key, value in env_vars.items():
            if '<GENERATE_WITH_openssl_rand_-base64_32>' in value:
                env_vars[key] = generate_secret(32)
                print(f"✓ Generated {key}")
            elif '<GENERATE_WITH_openssl_rand_-hex_16>' in value:
                env_vars[key] = generate_hex_secret(16)
                print(f"✓ Generated {key}")
    
    # Save to output file
    output_path = Path('.env.amplify.json')
    with open(output_path, 'w') as f:
        json.dump(env_vars, f, indent=2)
    
    print()
    print("=" * 60)
    print("✅ Configuration saved to: .env.amplify.json")
    print("=" * 60)
    print()
    
    # Show summary
    print("📊 Summary:")
    configured = sum(1 for v in env_vars.values() if not (v.startswith('<') and v.endswith('>')))
    total = len(env_vars)
    print(f"   Configured: {configured}/{total} variables")
    print()
    
    # Show next steps
    print("📋 Next Steps:")
    print()
    print("1. Edit .env.amplify.json and replace remaining <PLACEHOLDER> values")
    print()
    print("2. Push to Amplify using AWS CLI:")
    print("   aws amplify update-branch \\")
    print("     --app-id d33l77zi1h78ce \\")
    print("     --branch-name production-ready \\")
    print("     --environment-variables file://.env.amplify.json")
    print()
    print("3. Or manually add variables in Amplify Console:")
    print("   https://console.aws.amazon.com/amplify/home?region=us-east-1#/d33l77zi1h78ce")
    print()
    
    # Show generated secrets
    print("🔐 Generated Secrets (save these securely!):")
    print("-" * 60)
    if 'NEXTAUTH_SECRET' in env_vars and not env_vars['NEXTAUTH_SECRET'].startswith('<'):
        print(f"NEXTAUTH_SECRET: {env_vars['NEXTAUTH_SECRET']}")
    if 'CSRF_SECRET' in env_vars and not env_vars['CSRF_SECRET'].startswith('<'):
        print(f"CSRF_SECRET: {env_vars['CSRF_SECRET']}")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
